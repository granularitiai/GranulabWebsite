from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ConfidenceField(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str | None = None


class DocumentValidation(BaseModel):
    is_valid_supported_source: bool
    source_confidence: float = Field(ge=0.0, le=1.0)
    warnings: list[str] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)


class ProtocolIdentifiers(BaseModel):
    protocol_title: str | None = None
    protocol_number: str | None = None
    version: str | None = None
    date: str | None = None
    sponsor: str | None = None
    nct_id: str | None = None


class StudyOverview(BaseModel):
    brief_summary: str | None = None
    therapeutic_area: str | None = None
    condition: str | None = None
    phase: str | None = None
    study_type: str | None = None
    overall_status: str | None = None


class StudyDesign(BaseModel):
    allocation: str | None = None
    intervention_model: str | None = None
    masking: str | None = None
    primary_purpose: str | None = None
    enrollment: str | None = None
    number_of_arms: int | None = None
    duration: str | None = None


class Objective(BaseModel):
    text: str
    category: Literal["primary", "secondary", "exploratory"] | None = None
    source_evidence: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)


class Endpoint(BaseModel):
    name: str | None = None
    description: str | None = None
    time_frame: str | None = None
    category: Literal["primary", "secondary", "exploratory"] | None = None
    source_evidence: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)


class Objectives(BaseModel):
    primary_objectives: list[Objective] = Field(default_factory=list)
    secondary_objectives: list[Objective] = Field(default_factory=list)
    exploratory_objectives: list[Objective] = Field(default_factory=list)


class Endpoints(BaseModel):
    primary_endpoints: list[Endpoint] = Field(default_factory=list)
    secondary_endpoints: list[Endpoint] = Field(default_factory=list)
    exploratory_endpoints: list[Endpoint] = Field(default_factory=list)


class EligibilityCriteria(BaseModel):
    inclusion_criteria: list[str] = Field(default_factory=list)
    exclusion_criteria: list[str] = Field(default_factory=list)
    sex: str | None = None
    minimum_age: str | None = None
    maximum_age: str | None = None
    healthy_volunteers: str | None = None


class Arm(BaseModel):
    name: str | None = None
    type: str | None = None
    description: str | None = None
    assigned_interventions: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class Intervention(BaseModel):
    name: str | None = None
    type: str | None = None
    description: str | None = None
    dose: str | None = None
    route: str | None = None
    frequency: str | None = None
    duration: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)


class VisitSchedule(BaseModel):
    visit: str | None = None
    window: str | None = None
    timing: str | None = None
    activities: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class Location(BaseModel):
    facility: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    raw: str | None = None


class SafetyMonitoring(BaseModel):
    adverse_event_monitoring: str | None = None
    serious_adverse_event_reporting: str | None = None
    dose_modification_rules: str | None = None
    stopping_rules: str | None = None


class StatisticalConsiderations(BaseModel):
    sample_size_rationale: str | None = None
    analysis_population: str | None = None
    primary_analysis_method: str | None = None
    interim_analysis: str | None = None


class RiskFlag(BaseModel):
    risk: str
    severity: Literal["low", "medium", "high"]
    rationale: str
    evidence: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)


class ProtocolIntelligence(BaseModel):
    source_type: Literal["protocol_document", "clinicaltrials_gov_export"]
    document_validation: DocumentValidation
    protocol_identifiers: ProtocolIdentifiers
    study_overview: StudyOverview
    study_design: StudyDesign
    objectives: Objectives
    endpoints: Endpoints
    eligibility: EligibilityCriteria
    arms: list[Arm] = Field(default_factory=list)
    interventions: list[Intervention] = Field(default_factory=list)
    visit_schedule: list[VisitSchedule] = Field(default_factory=list)
    locations: list[Location] = Field(default_factory=list)
    safety_monitoring: SafetyMonitoring
    statistical_considerations: StatisticalConsiderations
    operational_risk_flags: list[RiskFlag] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    confidence: dict[str, ConfidenceField] = Field(default_factory=dict)


class CsvExportRequest(BaseModel):
    data: ProtocolIntelligence | list[ProtocolIntelligence] | dict[str, Any] | list[dict[str, Any]]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
