EXTRACTION_SYSTEM_PROMPT = """
You are a clinical trial protocol intelligence extraction engine for a biotech analytics product.

You only extract structured intelligence from clinical trial protocol source text.
You are not a generic summarizer.

Rules:
- Return valid JSON only through the provided schema.
- Extract only information that is explicitly present in the source text.
- Use null for missing scalar fields.
- Use empty arrays for missing list fields.
- Never fabricate protocol identifiers, study details, endpoints, interventions, statistics, dates, sponsor names, or schedules.
- If a field is uncertain, keep the value null or include the uncertainty in missing_information.
- Include concise source_evidence strings when the schema has a source_evidence or evidence field.
- Include confidence scores from 0 to 1.
- For protocol documents, set source_type to "protocol_document".
- If the document appears not to be a clinical trial protocol, set document_validation.is_valid_supported_source to false, keep document_validation.source_confidence low, add a warning, and still extract any protocol-like information that is actually present.
- Make missing_information specific and actionable.
- Identify protocol-level operational risks only from the provided source text.

Operational risk examples to evaluate:
- Missing or vague primary endpoint
- Missing sample size rationale
- Complex eligibility criteria
- High visit burden
- Many exclusion criteria
- Unclear safety monitoring
- Unclear randomization or masking
- Missing statistical assumptions
- Ambiguous intervention details
- Missing schedule of activities
"""


def build_extraction_user_prompt(
    document_text: str,
    validation_confidence: float,
    validation_evidence: list[str],
) -> str:
    evidence = "\n".join(f"- {item}" for item in validation_evidence) or "- No clear protocol signals found."
    return f"""
Extract structured clinical trial protocol intelligence from the source text below.

Return one JSON object using this exact top-level structure:
{{
  "source_type": "protocol_document",
  "document_validation": {{
    "is_valid_supported_source": true,
    "source_confidence": 0.0,
    "warnings": [],
    "evidence": []
  }},
  "protocol_identifiers": {{
    "protocol_title": null,
    "protocol_number": null,
    "version": null,
    "date": null,
    "sponsor": null,
    "nct_id": null
  }},
  "study_overview": {{
    "brief_summary": null,
    "therapeutic_area": null,
    "condition": null,
    "phase": null,
    "study_type": null,
    "overall_status": null
  }},
  "study_design": {{
    "allocation": null,
    "intervention_model": null,
    "masking": null,
    "primary_purpose": null,
    "enrollment": null,
    "number_of_arms": null,
    "duration": null
  }},
  "objectives": {{
    "primary_objectives": [],
    "secondary_objectives": [],
    "exploratory_objectives": []
  }},
  "endpoints": {{
    "primary_endpoints": [],
    "secondary_endpoints": [],
    "exploratory_endpoints": []
  }},
  "eligibility": {{
    "inclusion_criteria": [],
    "exclusion_criteria": [],
    "sex": null,
    "minimum_age": null,
    "maximum_age": null,
    "healthy_volunteers": null
  }},
  "arms": [],
  "interventions": [],
  "visit_schedule": [],
  "locations": [],
  "safety_monitoring": {{
    "adverse_event_monitoring": null,
    "serious_adverse_event_reporting": null,
    "dose_modification_rules": null,
    "stopping_rules": null
  }},
  "statistical_considerations": {{
    "sample_size_rationale": null,
    "analysis_population": null,
    "primary_analysis_method": null,
    "interim_analysis": null
  }},
  "operational_risk_flags": [],
  "missing_information": [],
  "confidence": {{}}
}}

Heuristic protocol validation before LLM extraction:
- confidence: {validation_confidence:.2f}
- evidence:
{evidence}

Source text:
```text
{document_text}
```
"""
