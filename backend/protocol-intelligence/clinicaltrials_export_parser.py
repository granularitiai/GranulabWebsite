from __future__ import annotations

import json
import re
from io import BytesIO
from pathlib import Path
from typing import Any

import pandas as pd

from document_parser import FileTooLargeError, UnsupportedFileTypeError
from schemas import (
    Arm,
    ConfidenceField,
    DocumentValidation,
    EligibilityCriteria,
    Endpoint,
    Endpoints,
    Intervention,
    Location,
    Objectives,
    ProtocolIdentifiers,
    ProtocolIntelligence,
    RiskFlag,
    SafetyMonitoring,
    StatisticalConsiderations,
    StudyDesign,
    StudyOverview,
    VisitSchedule,
)


MAX_EXPORT_BYTES = 20 * 1024 * 1024
SUPPORTED_EXPORT_EXTENSIONS = {".csv", ".json"}

EXPECTED_EXPORT_FIELDS = {
    "nct number",
    "study title",
    "study url",
    "acronym",
    "study status",
    "brief summary",
    "conditions",
    "interventions",
    "primary outcome measures",
    "secondary outcome measures",
    "other outcome measures",
    "sponsor",
    "collaborators",
    "sex",
    "age",
    "phases",
    "enrollment",
    "study type",
    "study design",
    "start date",
    "primary completion date",
    "completion date",
    "locations",
}


FIELD_ALIASES = {
    "nct_id": ["nct number", "nct_number", "nctid", "nct id", "nct"],
    "title": ["study title", "brief title", "official title", "title"],
    "status": ["study status", "overall status", "status"],
    "summary": ["brief summary", "briefsummary", "description"],
    "conditions": ["conditions", "condition", "diseases"],
    "interventions": ["interventions", "intervention", "intervention names"],
    "primary_outcomes": ["primary outcome measures", "primary outcomes", "primary outcome"],
    "secondary_outcomes": ["secondary outcome measures", "secondary outcomes", "secondary outcome"],
    "other_outcomes": ["other outcome measures", "other outcomes", "other outcome"],
    "sponsor": ["sponsor", "lead sponsor", "lead sponsor name"],
    "collaborators": ["collaborators", "collaborator"],
    "sex": ["sex", "gender"],
    "age": ["age", "ages"],
    "minimum_age": ["minimum age", "min age"],
    "maximum_age": ["maximum age", "max age"],
    "phase": ["phases", "phase"],
    "enrollment": ["enrollment", "enrollment count"],
    "study_type": ["study type", "type"],
    "study_design": ["study design", "design"],
    "start_date": ["start date"],
    "primary_completion_date": ["primary completion date"],
    "completion_date": ["completion date"],
    "locations": ["locations", "location"],
    "eligibility": ["eligibility criteria", "eligibility"],
}


class ClinicalTrialsExportParsingError(ValueError):
    pass


def parse_clinicaltrials_export(filename: str, file_bytes: bytes) -> list[ProtocolIntelligence]:
    extension = validate_export_upload(filename, file_bytes)
    records = parse_csv(file_bytes) if extension == ".csv" else parse_json(file_bytes)
    if not records:
        raise ClinicalTrialsExportParsingError("ClinicalTrials.gov export contains no study records.")
    return [normalize_record(record) for record in records]


def validate_export_upload(filename: str, file_bytes: bytes) -> str:
    extension = Path(filename or "").suffix.lower()
    if extension not in SUPPORTED_EXPORT_EXTENSIONS:
        raise UnsupportedFileTypeError("Only CSV and JSON ClinicalTrials.gov export files are supported.")
    if not file_bytes:
        raise ClinicalTrialsExportParsingError("Uploaded export file is empty.")
    if len(file_bytes) > MAX_EXPORT_BYTES:
        raise FileTooLargeError("File is too large. Maximum supported export size is 20 MB.")
    return extension


def parse_csv(file_bytes: bytes) -> list[dict[str, Any]]:
    try:
        frame = pd.read_csv(BytesIO(file_bytes), dtype=str).fillna("")
    except Exception as exc:
        raise ClinicalTrialsExportParsingError("Could not parse the uploaded CSV export.") from exc
    return frame.to_dict(orient="records")


def parse_json(file_bytes: bytes) -> list[dict[str, Any]]:
    try:
        payload = json.loads(file_bytes.decode("utf-8-sig"))
    except Exception as exc:
        raise ClinicalTrialsExportParsingError("Could not parse the uploaded JSON export.") from exc

    if isinstance(payload, list):
        return [flatten_json_record(item) for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        if isinstance(payload.get("studies"), list):
            return [flatten_json_record(item) for item in payload["studies"] if isinstance(item, dict)]
        study_fields = payload.get("StudyFieldsResponse", {}).get("StudyFields")
        if isinstance(study_fields, list):
            return [flatten_json_record(item) for item in study_fields if isinstance(item, dict)]
        return [flatten_json_record(payload)]
    raise ClinicalTrialsExportParsingError("JSON export must contain a study object or an array of study objects.")


def flatten_json_record(record: dict[str, Any]) -> dict[str, Any]:
    flattened: dict[str, Any] = {}

    def walk(value: Any, prefix: str = "") -> None:
        if isinstance(value, dict):
            for key, nested in value.items():
                walk(nested, key)
        elif isinstance(value, list):
            flattened[prefix] = "; ".join(stringify(item) for item in value if stringify(item))
        else:
            flattened[prefix] = stringify(value)

    walk(record)
    flattened.update({key: stringify(value) for key, value in record.items() if not isinstance(value, (dict, list))})
    return flattened


def normalize_record(record: dict[str, Any]) -> ProtocolIntelligence:
    normalized = {normalize_key(key): stringify(value) for key, value in record.items()}
    confidence, evidence, warnings = validate_export_record(normalized)

    study_design_text = pick(normalized, "study_design")
    design_fields = parse_study_design(study_design_text)
    eligibility_text = pick(normalized, "eligibility")
    age_text = pick(normalized, "age")

    endpoints = Endpoints(
        primary_endpoints=parse_outcomes(pick(normalized, "primary_outcomes"), "primary"),
        secondary_endpoints=parse_outcomes(pick(normalized, "secondary_outcomes"), "secondary"),
        exploratory_endpoints=parse_outcomes(pick(normalized, "other_outcomes"), "exploratory"),
    )
    inclusion, exclusion = parse_eligibility(eligibility_text)

    missing = build_missing_information(normalized, endpoints, study_design_text)
    risks = build_export_risks(normalized, endpoints, study_design_text, missing)

    return ProtocolIntelligence(
        source_type="clinicaltrials_gov_export",
        document_validation=DocumentValidation(
            is_valid_supported_source=confidence >= 0.35,
            source_confidence=confidence,
            warnings=warnings,
            evidence=evidence,
        ),
        protocol_identifiers=ProtocolIdentifiers(
            protocol_title=pick(normalized, "title"),
            protocol_number=None,
            version=None,
            date=pick(normalized, "start_date"),
            sponsor=pick(normalized, "sponsor"),
            nct_id=pick(normalized, "nct_id"),
        ),
        study_overview=StudyOverview(
            brief_summary=pick(normalized, "summary"),
            therapeutic_area=None,
            condition=pick(normalized, "conditions"),
            phase=pick(normalized, "phase"),
            study_type=pick(normalized, "study_type"),
            overall_status=pick(normalized, "status"),
        ),
        study_design=StudyDesign(
            allocation=design_fields.get("allocation"),
            intervention_model=design_fields.get("intervention_model"),
            masking=design_fields.get("masking"),
            primary_purpose=design_fields.get("primary_purpose"),
            enrollment=pick(normalized, "enrollment"),
            number_of_arms=parse_number_of_arms(study_design_text, pick(normalized, "interventions")),
            duration=build_duration(pick(normalized, "start_date"), pick(normalized, "completion_date")),
        ),
        objectives=Objectives(),
        endpoints=endpoints,
        eligibility=EligibilityCriteria(
            inclusion_criteria=inclusion,
            exclusion_criteria=exclusion,
            sex=pick(normalized, "sex"),
            minimum_age=pick(normalized, "minimum_age") or parse_age(age_text, "minimum"),
            maximum_age=pick(normalized, "maximum_age") or parse_age(age_text, "maximum"),
            healthy_volunteers=None,
        ),
        arms=parse_arms(study_design_text),
        interventions=parse_interventions(pick(normalized, "interventions")),
        visit_schedule=[],
        locations=parse_locations(pick(normalized, "locations")),
        safety_monitoring=SafetyMonitoring(),
        statistical_considerations=StatisticalConsiderations(),
        operational_risk_flags=risks,
        missing_information=missing,
        confidence={
            "source_validation": ConfidenceField(confidence=confidence, rationale="Matched expected export fields."),
            "identifiers": ConfidenceField(confidence=0.9 if pick(normalized, "nct_id") or pick(normalized, "title") else 0.2),
            "endpoints": ConfidenceField(
                confidence=0.85 if endpoints.primary_endpoints or endpoints.secondary_endpoints else 0.25
            ),
            "study_design": ConfidenceField(confidence=0.75 if study_design_text else 0.2),
        },
    )


def validate_export_record(normalized: dict[str, str]) -> tuple[float, list[str], list[str]]:
    keys = set(normalized)
    expected_matches = sorted(keys & EXPECTED_EXPORT_FIELDS)
    alias_matches = sorted(alias for aliases in FIELD_ALIASES.values() for alias in aliases if alias in keys)
    evidence = sorted(set(expected_matches + alias_matches))
    confidence = min(1.0, len(evidence) / 8)
    warnings: list[str] = []
    if confidence < 0.35:
        warnings.append(
            "The uploaded file does not strongly match the expected ClinicalTrials.gov export structure."
        )
    if not pick(normalized, "nct_id"):
        warnings.append("NCT Number was not found in the export record.")
    if not pick(normalized, "title"):
        warnings.append("Study Title was not found in the export record.")
    return round(confidence, 2), evidence, warnings


def pick(record: dict[str, str], logical_name: str) -> str | None:
    for alias in FIELD_ALIASES[logical_name]:
        value = record.get(normalize_key(alias))
        if value:
            return value
    return None


def normalize_key(value: str) -> str:
    return re.sub(r"\s+", " ", str(value).strip().lower().replace("_", " ")).strip()


def stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    text = str(value).strip()
    return "" if text.lower() in {"nan", "none", "null"} else text


def split_multi_value(value: str | None) -> list[str]:
    if not value:
        return []
    parts = re.split(r"\s*(?:\||;|\n)\s*", value)
    return [part.strip(" -") for part in parts if part.strip(" -")]


def parse_outcomes(value: str | None, category: str) -> list[Endpoint]:
    return [
        Endpoint(description=item, category=category, confidence=0.8)
        for item in split_multi_value(value)
    ]


def parse_interventions(value: str | None) -> list[Intervention]:
    interventions: list[Intervention] = []
    for item in split_multi_value(value):
        type_match = re.match(r"([^:]+):\s*(.+)", item)
        interventions.append(
            Intervention(
                name=type_match.group(2).strip() if type_match else item,
                type=type_match.group(1).strip() if type_match else None,
                description=item,
                confidence=0.75,
            )
        )
    return interventions


def parse_study_design(value: str | None) -> dict[str, str | None]:
    fields = {"allocation": None, "intervention_model": None, "masking": None, "primary_purpose": None}
    if not value:
        return fields

    patterns = {
        "allocation": r"allocation\s*:\s*([^|;\n]+)",
        "intervention_model": r"intervention\s+model\s*:\s*([^|;\n]+)",
        "masking": r"masking\s*:\s*([^|;\n]+)",
        "primary_purpose": r"primary\s+purpose\s*:\s*([^|;\n]+)",
    }
    for key, pattern in patterns.items():
        match = re.search(pattern, value, flags=re.IGNORECASE)
        if match:
            fields[key] = match.group(1).strip()
    return fields


def parse_arms(study_design: str | None) -> list[Arm]:
    if not study_design:
        return []
    match = re.search(r"intervention\s+model\s*:\s*([^|;\n]+)", study_design, flags=re.IGNORECASE)
    if not match:
        return []
    return [Arm(name=match.group(1).strip(), type="design model", confidence=0.55)]


def parse_number_of_arms(study_design: str | None, interventions: str | None) -> int | None:
    if study_design:
        match = re.search(r"(\d+)\s+arms?", study_design, flags=re.IGNORECASE)
        if match:
            return int(match.group(1))
    parsed_interventions = split_multi_value(interventions)
    return len(parsed_interventions) if parsed_interventions else None


def parse_eligibility(value: str | None) -> tuple[list[str], list[str]]:
    if not value:
        return [], []
    inclusion = extract_section(value, "inclusion")
    exclusion = extract_section(value, "exclusion")
    return split_criteria(inclusion), split_criteria(exclusion)


def extract_section(value: str, label: str) -> str:
    opposite = "exclusion" if label == "inclusion" else "inclusion"
    match = re.search(
        rf"{label}\s+criteria\s*:?\s*(.*?)(?:{opposite}\s+criteria\s*:|$)",
        value,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return match.group(1) if match else ""


def split_criteria(value: str) -> list[str]:
    if not value:
        return []
    parts = re.split(r"\n+|(?:^|\s)\d+\.\s+|;\s+", value)
    return [part.strip(" -") for part in parts if len(part.strip(" -")) > 2]


def parse_age(value: str | None, kind: str) -> str | None:
    if not value:
        return None
    if kind == "minimum":
        match = re.search(r"(?:minimum|min)\s+age\s*:?\s*([^|;\n]+)", value, flags=re.IGNORECASE)
    else:
        match = re.search(r"(?:maximum|max)\s+age\s*:?\s*([^|;\n]+)", value, flags=re.IGNORECASE)
    return match.group(1).strip() if match else None


def parse_locations(value: str | None) -> list[Location]:
    return [Location(raw=item) for item in split_multi_value(value)]


def build_duration(start: str | None, completion: str | None) -> str | None:
    if start and completion:
        return f"{start} to {completion}"
    return None


def build_missing_information(
    record: dict[str, str],
    endpoints: Endpoints,
    study_design: str | None,
) -> list[str]:
    missing: list[str] = []
    checks = {
        "NCT Number": pick(record, "nct_id"),
        "Study Title": pick(record, "title"),
        "Sponsor": pick(record, "sponsor"),
        "Brief Summary": pick(record, "summary"),
        "Conditions": pick(record, "conditions"),
        "Phase": pick(record, "phase"),
        "Enrollment": pick(record, "enrollment"),
        "Study Design": study_design,
        "Locations": pick(record, "locations"),
    }
    for label, value in checks.items():
        if not value:
            missing.append(label)
    if not endpoints.primary_endpoints:
        missing.append("Primary Outcome Measures")
    return missing


def build_export_risks(
    record: dict[str, str],
    endpoints: Endpoints,
    study_design: str | None,
    missing: list[str],
) -> list[RiskFlag]:
    risks: list[RiskFlag] = []
    if not endpoints.primary_endpoints:
        risks.append(
            RiskFlag(
                risk="Missing or unclear primary outcome measures",
                severity="high",
                rationale="No primary outcome measure field was found in the export record.",
                confidence=0.85,
            )
        )
    if "Enrollment" in missing:
        risks.append(
            RiskFlag(
                risk="Missing enrollment",
                severity="medium",
                rationale="Enrollment was not available in the export record.",
                confidence=0.75,
            )
        )
    if not study_design:
        risks.append(
            RiskFlag(
                risk="Missing study design",
                severity="medium",
                rationale="Study Design was not available in the export record.",
                confidence=0.75,
            )
        )
    if not pick(record, "locations"):
        risks.append(
            RiskFlag(
                risk="Missing locations",
                severity="low",
                rationale="Locations were not available in the export record.",
                confidence=0.7,
            )
        )
    return risks
