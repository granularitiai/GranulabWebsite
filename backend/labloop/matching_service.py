from __future__ import annotations

import json
from datetime import datetime

from ai_service import fallback_categorize
from schemas import CategorizeRequest, MatchResult


def match_need_to_listings(conn, need: dict, limit: int = 10) -> list[MatchResult]:
    listings = [dict(row) for row in conn.execute("SELECT * FROM equipment_listings").fetchall()]
    need_category = fallback_categorize(
        CategorizeRequest(title=need["needed_equipment"], lot_description=need.get("intended_use"))
    ).suggested_category
    preferred_states = set(_json_list(need.get("preferred_states") or "[]"))
    need_terms = _terms(f"{need['needed_equipment']} {need.get('intended_use') or ''}")
    results: list[MatchResult] = []

    for listing in listings:
        score = 0
        reasons: list[str] = []
        listing_terms = _terms(
            f"{listing.get('title') or ''} {listing.get('cleaned_title') or ''} {listing.get('description') or ''} {listing.get('category') or ''}"
        )
        overlap = need_terms & listing_terms

        if listing.get("category") == need_category and need_category != "Other":
            score += 28
            reasons.append(f"Category match: {listing.get('category')}")
        if overlap:
            score += min(22, len(overlap) * 5)
            reasons.append(f"Keyword overlap: {', '.join(sorted(list(overlap))[:5])}")
        if preferred_states and (listing.get("location_state") or "").upper() in preferred_states:
            score += 12
            reasons.append(f"Preferred state match: {listing.get('location_state')}")
        if need.get("max_budget") and listing.get("current_bid") is not None and listing["current_bid"] <= need["max_budget"]:
            score += 12
            reasons.append("Current bid is within stated budget")
        if (listing.get("auction_status") or "").lower() in {"active", "open"}:
            score += 8
            reasons.append("Auction appears active")

        score += min(10, int((listing.get("scientific_relevance_score") or 0) / 10))
        score += min(8, int((listing.get("equipment_confidence_score") or 0) / 12))

        if _ending_soon(listing.get("auction_end_date")):
            score += 5 if need.get("urgency") == "High" else 2
            reasons.append("Auction may be ending soon")

        if score <= 0:
            continue

        listing = decode_listing_json_fields(listing)
        results.append(
            MatchResult(
                listing_id=listing["id"],
                listing_title=listing.get("cleaned_title") or listing.get("title") or "Untitled listing",
                match_score=min(100, score),
                why_it_matched=reasons or ["General scientific equipment relevance"],
                category=listing.get("category") or "Other",
                current_bid=listing.get("current_bid"),
                auction_end_date=listing.get("auction_end_date"),
                location=", ".join(part for part in [listing.get("location_city"), listing.get("location_state")] if part) or None,
                agency_name=listing.get("agency_name"),
                scientific_relevance_score=listing.get("scientific_relevance_score") or 0,
                confidence_score=listing.get("equipment_confidence_score") or 0,
                source_url=listing.get("source_url"),
                listing=listing,
            )
        )

    return sorted(results, key=lambda item: item.match_score, reverse=True)[:limit]


def decode_listing_json_fields(listing: dict) -> dict:
    for key in ("recommended_tags", "buyer_use_cases", "risk_notes"):
        try:
            listing[key] = json.loads(listing.get(key) or "[]")
        except json.JSONDecodeError:
            listing[key] = []
    return listing


def _terms(text: str) -> set[str]:
    return {term for term in text.lower().replace("/", " ").replace("-", " ").split() if len(term) > 2}


def _json_list(value: str) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
        return [str(item).strip().upper() for item in parsed if str(item).strip()]
    except json.JSONDecodeError:
        return []


def _ending_soon(value: str | None) -> bool:
    if not value:
        return False
    for parser in (
        lambda text: datetime.fromisoformat(text.replace("Z", "+00:00")),
        lambda text: datetime.strptime(text[:10], "%Y-%m-%d"),
        lambda text: datetime.strptime(text[:10], "%m/%d/%Y"),
    ):
        try:
            parsed = parser(value[:19])
            if parsed.tzinfo is not None:
                parsed = parsed.replace(tzinfo=None)
            seconds_until_end = (parsed - datetime.utcnow()).total_seconds()
            return 0 <= seconds_until_end <= 7 * 24 * 60 * 60
        except ValueError:
            continue
    return False
