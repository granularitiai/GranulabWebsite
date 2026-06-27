from __future__ import annotations

import json
import logging
import os

from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI
from pydantic import ValidationError
from dotenv import load_dotenv

from openai_config import get_openai_api_key
from prompts import EXTRACTION_SYSTEM_PROMPT, build_extraction_user_prompt
from schemas import DocumentValidation, ProtocolIntelligence


load_dotenv()
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_TIMEOUT_SECONDS = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "180"))
logger = logging.getLogger(__name__)


class OpenAIExtractionError(RuntimeError):
    pass


class LLMJsonParsingError(RuntimeError):
    pass


def extract_protocol_intelligence(
    document_text: str,
    heuristic_validation: dict,
    warnings: list[str] | None = None,
) -> ProtocolIntelligence:
    api_key = get_openai_api_key()
    if not api_key:
        raise OpenAIExtractionError("OPENAI_API_KEY is not configured.")

    prompt = build_extraction_user_prompt(
        document_text=document_text,
        validation_confidence=float(heuristic_validation.get("confidence", 0.0)),
        validation_evidence=list(heuristic_validation.get("evidence", [])),
    )

    client = OpenAI(api_key=api_key, timeout=OPENAI_TIMEOUT_SECONDS)
    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
    except APITimeoutError as exc:
        logger.exception("OpenAI API timed out during protocol extraction.")
        raise OpenAIExtractionError(
            "OpenAI extraction timed out from the backend process. "
            "Large protocols can take longer; increase OPENAI_TIMEOUT_SECONDS or reduce appendices."
        ) from exc
    except APIConnectionError as exc:
        logger.exception("OpenAI API connection failed during protocol extraction.")
        cause = str(exc.__cause__ or exc)
        if "WinError 10013" in cause:
            message = (
                "The backend process was blocked from opening an outbound socket to api.openai.com. "
                "This often happens when Uvicorn is launched from a sandboxed shell. "
                "Restart the backend from a normal PowerShell terminal."
            )
        else:
            message = (
                "The backend process could not connect to api.openai.com. "
                "Run GET /diagnostics/openai from the same backend process to check DNS, HTTPS, proxy, and auth."
            )
        raise OpenAIExtractionError(message) from exc
    except APIStatusError as exc:
        logger.exception("OpenAI API returned status %s during protocol extraction.", exc.status_code)
        if exc.status_code == 401:
            message = "OpenAI authentication failed. Check that OPENAI_API_KEY is set and valid."
        elif exc.status_code == 429:
            message = "OpenAI rate limit or quota error. Check project billing, quota, and retry later."
        else:
            message = f"OpenAI API returned an error with status {exc.status_code}."
        raise OpenAIExtractionError(message) from exc
    except Exception as exc:
        logger.exception("OpenAI extraction failed before JSON parsing.")
        raise OpenAIExtractionError("OpenAI extraction failed.") from exc

    try:
        content = response.choices[0].message.content
        if not content:
            raise LLMJsonParsingError("OpenAI returned an empty response.")
        parsed = ProtocolIntelligence.model_validate(coerce_protocol_payload(json.loads(content)))
    except (json.JSONDecodeError, ValidationError, TypeError) as exc:
        logger.exception("OpenAI returned JSON that did not match the protocol schema.")
        raise LLMJsonParsingError("OpenAI returned JSON that did not match the protocol schema.") from exc

    parsed = merge_validation_and_warnings(parsed, heuristic_validation, warnings or [])
    return parsed


def coerce_protocol_payload(payload: dict) -> dict:
    payload.setdefault("source_type", "protocol_document")
    payload.setdefault("locations", [])
    payload.setdefault("confidence", {})

    coerce_scalar_fields(payload)
    coerce_objectives(payload)
    coerce_endpoints(payload)
    payload["arms"] = [coerce_confidence_item(item, {"name": str(item)}, 0.4) for item in payload.get("arms", [])]
    payload["interventions"] = [
        coerce_confidence_item(item, {"name": str(item), "description": str(item)}, 0.4)
        for item in payload.get("interventions", [])
    ]
    payload["visit_schedule"] = [
        coerce_confidence_item(item, {"visit": str(item), "activities": []}, 0.4)
        for item in payload.get("visit_schedule", [])
    ]
    payload["locations"] = [
        item if isinstance(item, dict) else {"raw": str(item)}
        for item in payload.get("locations", [])
    ]
    payload["operational_risk_flags"] = [
        item
        if isinstance(item, dict)
        else {
            "risk": str(item),
            "severity": "medium",
            "rationale": "Identified by the extraction model.",
            "confidence": 0.4,
        }
        for item in payload.get("operational_risk_flags", [])
    ]
    payload["confidence"] = {
        key: value if isinstance(value, dict) else {"confidence": float(value), "rationale": None}
        for key, value in payload.get("confidence", {}).items()
        if isinstance(value, (int, float, dict))
    }
    return payload


def coerce_scalar_fields(payload: dict) -> None:
    coerce_nested_strings(
        payload.get("study_design") or {},
        ["allocation", "intervention_model", "masking", "primary_purpose", "enrollment", "duration"],
    )
    coerce_nested_strings(
        payload.get("eligibility") or {},
        ["sex", "minimum_age", "maximum_age", "healthy_volunteers"],
    )
    coerce_nested_strings(
        payload.get("protocol_identifiers") or {},
        ["protocol_title", "protocol_number", "version", "date", "sponsor", "nct_id"],
    )
    coerce_nested_strings(
        payload.get("study_overview") or {},
        ["brief_summary", "therapeutic_area", "condition", "phase", "study_type", "overall_status"],
    )


def coerce_nested_strings(section: dict, keys: list[str]) -> None:
    for key in keys:
        value = section.get(key)
        if value is None or isinstance(value, str):
            continue
        if isinstance(value, bool):
            section[key] = "Yes" if value else "No"
        else:
            section[key] = str(value)


def coerce_objectives(payload: dict) -> None:
    objectives = payload.get("objectives") or {}
    for key, category in [
        ("primary_objectives", "primary"),
        ("secondary_objectives", "secondary"),
        ("exploratory_objectives", "exploratory"),
    ]:
        objectives[key] = [
            coerce_confidence_item(item, {"text": str(item), "category": category}, 0.4)
            for item in objectives.get(key, [])
        ]
    payload["objectives"] = objectives


def coerce_endpoints(payload: dict) -> None:
    endpoints = payload.get("endpoints") or {}
    for key, category in [
        ("primary_endpoints", "primary"),
        ("secondary_endpoints", "secondary"),
        ("exploratory_endpoints", "exploratory"),
    ]:
        endpoints[key] = [
            coerce_confidence_item(item, {"description": str(item), "category": category}, 0.4)
            for item in endpoints.get(key, [])
        ]
    payload["endpoints"] = endpoints


def coerce_confidence_item(item: object, fallback: dict, default_confidence: float) -> dict:
    coerced = item if isinstance(item, dict) else fallback
    if "confidence" not in coerced or coerced["confidence"] is None:
        coerced["confidence"] = default_confidence
    return coerced


def merge_validation_and_warnings(
    parsed: ProtocolIntelligence,
    heuristic_validation: dict,
    warnings: list[str],
) -> ProtocolIntelligence:
    heuristic_confidence = float(heuristic_validation.get("source_confidence", heuristic_validation.get("confidence", 0.0)))
    heuristic_appears = bool(heuristic_validation.get("is_valid_supported_source", False))
    heuristic_evidence = list(heuristic_validation.get("evidence", []))

    protocol_warning = (
        "The uploaded document does not strongly appear to be a clinical trial protocol; "
        "review all extracted fields before using them."
    )

    if not heuristic_appears:
        parsed.document_validation = DocumentValidation(
            is_valid_supported_source=False,
            source_confidence=min(parsed.document_validation.source_confidence, heuristic_confidence, 0.35),
            warnings=sorted(set(parsed.document_validation.warnings + warnings + [protocol_warning])),
            evidence=sorted(set(parsed.document_validation.evidence + heuristic_evidence)),
        )
    else:
        parsed.document_validation = DocumentValidation(
            is_valid_supported_source=parsed.document_validation.is_valid_supported_source,
            source_confidence=max(parsed.document_validation.source_confidence, heuristic_confidence),
            warnings=sorted(set(parsed.document_validation.warnings + warnings)),
            evidence=parsed.document_validation.evidence or heuristic_evidence,
        )

    return parsed
