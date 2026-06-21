from __future__ import annotations

import json
import os
import re
from typing import Any

from schemas import CategorizeRequest, CategorizeResponse


LAB_EQUIPMENT_TERMS = [
    "microscope",
    "centrifuge",
    "ultracentrifuge",
    "incubator",
    "co2 incubator",
    "pcr",
    "qpcr",
    "thermal cycler",
    "spectrophotometer",
    "plate reader",
    "microplate reader",
    "pipette",
    "biosafety cabinet",
    "bsc",
    "autoclave",
    "hplc",
    "gas chromatograph",
    "gas chromatography",
    "mass spectrometer",
    "liquid handler",
    "water bath",
    "fume hood",
    "laminar flow",
    "electrophoresis",
    "sequencer",
    "flow cytometer",
    "cell counter",
    "gel documentation",
    "nanodrop",
    "bioanalyzer",
    "chromatography",
]

CONTEXT_REQUIRED_LAB_EQUIPMENT_TERMS = [
    "freezer",
    "refrigerator",
    "analyzer",
    "shaker",
    "balance",
    "scale",
    "cold storage",
]

LAB_EQUIPMENT_CONTEXT_TERMS = [
    "laboratory",
    "lab equipment",
    "scientific equipment",
    "research equipment",
    "biotech",
    "biotechnology",
    "biology",
    "molecular biology",
    "cell culture",
    "chemistry",
    "life science",
    "lab-grade",
    "laboratory-grade",
    "sample storage",
    "biobank",
]

BIOTECH_BRAND_TERMS = [
    "thermo",
    "thermo fisher",
    "eppendorf",
    "beckman",
    "beckman coulter",
    "bio-rad",
    "agilent",
    "perkinelmer",
    "waters",
    "shimadzu",
    "leica",
    "olympus",
    "nikon",
    "zeiss",
    "mettler",
    "sartorius",
    "hamilton",
    "tecan",
    "fisher scientific",
    "vwr",
]

EXCLUDED_MEDICAL_ONLY_TERMS = [
    "endobronchial",
    "endoscope",
    "bronchoscope",
    "ophthalmic",
    "ultrasound",
    "catheter",
    "catheters",
    "drainage catheter",
    "drainage catheters",
    "surgical",
    "surgery",
    "patient monitor",
    "patient lift",
    "stretcher",
    "wheelchair",
    "hospital bed",
    "medical equipment",
    "medical devices",
    "medical statement of intent",
    "medical panel pc",
    "video processor",
    "probe driving",
    "magnetic resonance",
    "computed tomography",
    "ct scanner",
    "x-ray",
    "pet scanner",
    "scanner",
    "biopsy",
    "ablation",
]

EXCLUDED_NON_LAB_EQUIPMENT_TERMS = [
    "aircraft",
    "airframe",
    "automobile",
    "boat",
    "battery charger",
    "cart",
    "container",
    "desktop monitor",
    "fax machine",
    "forklift",
    "gps",
    "headset",
    "laptop",
    "lathe",
    "microphone",
    "milling machine",
    "monitor stand",
    "pallet jack",
    "phone",
    "pickup truck",
    "pressure washer",
    "recycle bin",
    "scrap",
    "shop equipment",
    "snowmobile",
    "trailer",
    "truck",
    "vehicle",
]

SCIENTIFIC_KEYWORDS = sorted(
    {
        *LAB_EQUIPMENT_TERMS,
        *CONTEXT_REQUIRED_LAB_EQUIPMENT_TERMS,
        *LAB_EQUIPMENT_CONTEXT_TERMS,
        *BIOTECH_BRAND_TERMS,
    }
)

CATEGORY_RULES = [
    ("PCR Machine", ["pcr", "thermal cycler", "qpcr"]),
    ("Centrifuge", ["centrifuge", "ultracentrifuge", "centrifugation"]),
    ("Microscope", ["microscope"]),
    ("Freezer", ["freezer", "-80", "ultra low"]),
    ("Refrigerator", ["refrigerator", "fridge"]),
    ("Incubator", ["incubator", "co2"]),
    ("Biosafety Cabinet", ["biosafety", "bsc", "laminar"]),
    ("Pipette", ["pipette"]),
    ("Spectrophotometer", ["spectrophotometer"]),
    ("Autoclave", ["autoclave"]),
    ("HPLC", ["hplc"]),
    ("GC", ["gas chromatograph", "gas chromatography"]),
    ("Mass Spectrometer", ["mass spectrometer", " ms "]),
    ("Plate Reader", ["plate reader", "microplate"]),
    ("Sequencer", ["sequencer"]),
    ("Fume Hood", ["fume hood"]),
    ("Balance / Scale", ["balance", "scale"]),
    ("Water Bath", ["water bath"]),
    ("Analytical Instrument", ["analyzer", "chromatography", "spectrometer"]),
    ("Cold Storage", ["cold storage"]),
    ("Lab Furniture", ["bench", "cabinet", "casework"]),
]

DEFAULT_RISK_NOTES = [
    "Verify working condition before bidding.",
    "Confirm calibration status.",
    "Review inspection instructions directly on GSA.",
    "Confirm pickup and transportation requirements.",
    "Review auction terms before bidding.",
    "Check whether decontamination documentation is needed.",
    "Do not assume equipment is functional unless explicitly stated.",
    "Confirm power requirements, dimensions, and installation needs.",
]


def combined_text(*values: str | None) -> str:
    return " ".join(value or "" for value in values).strip()


def is_scientific_listing(payload: dict[str, Any]) -> bool:
    haystack = combined_text(
        _field(payload, "ItemName", "itemName"),
        _field(payload, "LotDescript", "lotDescript", "lotDescription"),
        _field(payload, "AgencyName", "agencyName"),
        _field(payload, "BureauName", "bureauName"),
        _field(payload, "Instruction1", "instruction1", "instruction"),
        _field(payload, "Instruction2", "instruction2"),
        _field(payload, "Instruction3", "instruction3"),
        json.dumps(_field(payload, "lotInfo", "LotInfo") or "", ensure_ascii=False),
    ).lower()
    title_text = combined_text(_field(payload, "ItemName", "itemName")).lower()
    has_lab_equipment = _contains_any(haystack, LAB_EQUIPMENT_TERMS)
    has_context_required_equipment = _contains_any(haystack, CONTEXT_REQUIRED_LAB_EQUIPMENT_TERMS)
    has_title_equipment = _contains_any(
        title_text, [*LAB_EQUIPMENT_TERMS, *CONTEXT_REQUIRED_LAB_EQUIPMENT_TERMS]
    )
    has_lab_context = _contains_any(haystack, LAB_EQUIPMENT_CONTEXT_TERMS)
    has_biotech_brand = _contains_any(haystack, BIOTECH_BRAND_TERMS)
    has_medical_only_signal = _contains_any(haystack, EXCLUDED_MEDICAL_ONLY_TERMS)
    has_medical_title = _contains_any(title_text, ["medical equipment", "ophthalmic", "catheter", "catheters", "scanner"])
    has_non_lab_signal = _contains_any(haystack, EXCLUDED_NON_LAB_EQUIPMENT_TERMS)

    if has_medical_only_signal and (has_medical_title or not has_title_equipment):
        return False

    if has_non_lab_signal and not has_lab_context:
        return False

    if has_lab_equipment and has_title_equipment:
        return True

    if has_context_required_equipment and (has_lab_context or has_biotech_brand):
        return True

    return False


def _contains_any(text: str, terms: list[str]) -> bool:
    return any(_contains_term(text, term) for term in terms)


def _contains_term(text: str, term: str) -> bool:
    term = term.strip().lower()
    if not term:
        return False
    return re.search(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", text) is not None


def _field(payload: dict[str, Any], *names: str) -> Any:
    for name in names:
        value = payload.get(name)
        if value not in (None, ""):
            return value
    return None


def categorize_equipment(request: CategorizeRequest) -> CategorizeResponse:
    if os.getenv("OPENAI_API_KEY"):
        try:
            return _categorize_with_openai(request)
        except Exception:
            return fallback_categorize(request)
    return fallback_categorize(request)


def fallback_categorize(request: CategorizeRequest) -> CategorizeResponse:
    text = f" {combined_text(request.title, request.lot_description, request.agency_name, request.bureau_name).lower()} "
    category = "Other"
    for candidate, terms in CATEGORY_RULES:
        if _contains_any(text, terms):
            category = candidate
            break

    matched_keywords = sorted({keyword for keyword in SCIENTIFIC_KEYWORDS if _contains_term(text, keyword)})[:8]
    relevance = min(100, 35 + len(matched_keywords) * 8)
    confidence = 85 if category != "Other" else max(35, min(65, len(matched_keywords) * 10))
    cleaned = clean_title(request.title)
    improved = request.lot_description or f"GSA auction listing for {cleaned}."

    return CategorizeResponse(
        suggested_category=category,
        suggested_subcategory=None,
        cleaned_title=cleaned,
        improved_description=improved,
        estimated_value_range="Unknown",
        recommended_tags=[category, "GSA Auction", "Lab Equipment", *matched_keywords],
        buyer_use_cases=_buyer_use_cases(category),
        risk_notes=DEFAULT_RISK_NOTES,
        scientific_relevance_score=relevance if matched_keywords or category != "Other" else 20,
        equipment_confidence_score=confidence,
    )


def clean_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title or "").strip()
    return title.title() if title.isupper() else title


def _buyer_use_cases(category: str) -> list[str]:
    use_cases = {
        "Centrifuge": ["Sample preparation", "Teaching lab workflows", "Biotech R&D support"],
        "Microscope": ["Teaching microscopy", "Research imaging", "Quality inspection"],
        "PCR Machine": ["Molecular biology workflows", "Teaching genomics", "Assay development"],
        "Freezer": ["Cold-chain storage", "Sample storage", "Biobank support"],
        "Biosafety Cabinet": ["Cell culture workflows", "Biosafety operations"],
        "Analytical Instrument": ["Analytical testing", "Method development", "Research operations"],
    }
    return use_cases.get(category, ["Research operations", "STEM education", "Lab infrastructure support"])


def _categorize_with_openai(request: CategorizeRequest) -> CategorizeResponse:
    from openai import OpenAI

    client = OpenAI()
    prompt = (
        "Analyze this GSA auction listing and determine whether it is relevant to scientific, laboratory, biotech, "
        "clinical, research, or STEM education use. Categorize the equipment, clean the title, improve the description, "
        "estimate a broad used-market value range if possible, suggest tags, identify likely buyer use cases, and list "
        "risk notes. Do not claim the item is verified, safe, calibrated, clean, functional, or suitable for use unless "
        "explicitly stated in the listing."
    )
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": json.dumps(request.model_dump(), ensure_ascii=False),
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    content = response.choices[0].message.content or "{}"
    data = json.loads(content)
    return CategorizeResponse(
        suggested_category=data.get("suggested_category") or data.get("category") or "Other",
        suggested_subcategory=data.get("suggested_subcategory") or data.get("subcategory"),
        cleaned_title=data.get("cleaned_title") or clean_title(request.title),
        improved_description=data.get("improved_description") or request.lot_description or "",
        estimated_value_range=data.get("estimated_value_range") or "Unknown",
        recommended_tags=list(data.get("recommended_tags") or []),
        buyer_use_cases=list(data.get("buyer_use_cases") or []),
        risk_notes=list(data.get("risk_notes") or DEFAULT_RISK_NOTES),
        scientific_relevance_score=int(data.get("scientific_relevance_score") or 0),
        equipment_confidence_score=int(data.get("equipment_confidence_score") or 0),
    )
