from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CategorizeRequest(BaseModel):
    title: str = ""
    lot_description: str | None = None
    agency_name: str | None = None
    bureau_name: str | None = None
    source_url: str | None = None


class CategorizeResponse(BaseModel):
    suggested_category: str
    suggested_subcategory: str | None = None
    cleaned_title: str
    improved_description: str
    estimated_value_range: str = "Unknown"
    recommended_tags: list[str] = Field(default_factory=list)
    buyer_use_cases: list[str] = Field(default_factory=list)
    risk_notes: list[str] = Field(default_factory=list)
    scientific_relevance_score: int = 0
    equipment_confidence_score: int = 0


class NeedCreate(BaseModel):
    requester_name: str
    organization_name: str
    organization_type: str
    email: str
    city: str | None = None
    state: str | None = None
    needed_equipment: str
    intended_use: str | None = None
    max_budget: float | None = None
    preferred_states: list[str] = Field(default_factory=list)
    urgency: str = "Medium"


class SyncSummary(BaseModel):
    total_listings_retrieved: int = 0
    scientific_listings_found: int = 0
    listings_added: int = 0
    listings_updated: int = 0
    duplicates_skipped: int = 0
    sync_started_at: datetime
    sync_completed_at: datetime | None = None
    errors: list[str] = Field(default_factory=list)


class MatchResult(BaseModel):
    listing_id: int
    listing_title: str
    match_score: int
    why_it_matched: list[str]
    category: str
    current_bid: float | None = None
    auction_end_date: str | None = None
    location: str | None = None
    agency_name: str | None = None
    scientific_relevance_score: int
    confidence_score: int
    source_url: str | None = None
    listing: dict | None = None
