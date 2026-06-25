from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from ai_service import categorize_equipment
from database import get_connection, init_db, row_to_dict
from gsa_ingestion import sync_gsa_auctions
from matching_service import decode_listing_json_fields, match_need_to_listings
from schemas import CategorizeRequest, NeedCreate


load_dotenv(Path(__file__).with_name(".env"), override=True)
init_db()


def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://granularitiwebsite.vercel.app",
    ]

app = FastAPI(
    title="LabLoop API",
    version="0.1.0",
    description="Discovery and matching layer for scientific equipment from GSA Auctions.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, Any]:
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) AS count FROM equipment_listings").fetchone()["count"]
        latest = conn.execute(
            "SELECT last_synced_at FROM equipment_listings WHERE last_synced_at IS NOT NULL ORDER BY last_synced_at DESC LIMIT 1"
        ).fetchone()
    return {
        "status": "ok",
        "service": "labloop-api",
        "gsa_api_key_present": bool(os.getenv("GSA_API_KEY")),
        "openai_api_key_present": bool(os.getenv("OPENAI_API_KEY")),
        "total_listings": total,
        "scientific_listings": total,
        "last_synced_at": latest["last_synced_at"] if latest else None,
    }


@app.get("/api/ingest/gsa-auctions")
def ingest_gsa_auctions():
    with get_connection() as conn:
        return sync_gsa_auctions(conn)


@app.get("/api/listings")
def list_listings(
    q: str | None = None,
    category: str | None = None,
    state: str | None = None,
    city: str | None = None,
    agency: str | None = None,
    auction_status: str | None = None,
    min_bid: float | None = None,
    max_bid: float | None = None,
    min_relevance: int | None = None,
    min_confidence: int | None = None,
    ending_soon: bool = False,
    sort: str = "newest_synced",
):
    clauses: list[str] = []
    params: list[Any] = []
    if q:
        clauses.append(
            "(title LIKE ? OR cleaned_title LIKE ? OR description LIKE ? OR category LIKE ?)"
        )
        like = f"%{q}%"
        params.extend([like, like, like, like])
    if category:
        clauses.append("category = ?")
        params.append(category)
    if state:
        clauses.append("location_state = ?")
        params.append(state)
    if city:
        clauses.append("location_city LIKE ?")
        params.append(f"%{city}%")
    if agency:
        clauses.append("agency_name LIKE ?")
        params.append(f"%{agency}%")
    if auction_status:
        clauses.append("auction_status = ?")
        params.append(auction_status)
    if min_bid is not None:
        clauses.append("current_bid >= ?")
        params.append(min_bid)
    if max_bid is not None:
        clauses.append("current_bid <= ?")
        params.append(max_bid)
    if min_relevance is not None:
        clauses.append("scientific_relevance_score >= ?")
        params.append(min_relevance)
    if min_confidence is not None:
        clauses.append("equipment_confidence_score >= ?")
        params.append(min_confidence)
    if ending_soon or sort != "newest_synced":
        now = datetime.utcnow().replace(microsecond=0)
        one_week_from_now = now + timedelta(days=7)
        clauses.append("datetime(auction_end_date) >= datetime(?)")
        clauses.append("datetime(auction_end_date) <= datetime(?)")
        params.extend([now.isoformat(), one_week_from_now.isoformat()])

    sort_map = {
        "ending_soonest": "datetime(auction_end_date) ASC",
        "newest_synced": "last_synced_at DESC",
        "highest_relevance": "scientific_relevance_score DESC",
        "lowest_current_bid": "current_bid ASC",
        "highest_current_bid": "current_bid DESC",
        "most_bidders": "bidders_count DESC",
    }
    sql = "SELECT * FROM equipment_listings"
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += f" ORDER BY {sort_map.get(sort, 'last_synced_at DESC')} LIMIT 250"

    with get_connection() as conn:
        rows = conn.execute(sql, tuple(params)).fetchall()
    return [serialize_listing(dict(row)) for row in rows]


@app.get("/api/listings/{listing_id}")
def get_listing(listing_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM equipment_listings WHERE id = ?", (listing_id,)).fetchone()
    listing = row_to_dict(row)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
    return serialize_listing(listing)


@app.delete("/api/listings/{listing_id}")
def delete_listing(listing_id: int):
    with get_connection() as conn:
        result = conn.execute("DELETE FROM equipment_listings WHERE id = ?", (listing_id,))
        conn.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Listing not found.")
    return {"deleted": True, "id": listing_id}


@app.get("/api/needs")
def list_needs():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM need_requests ORDER BY created_at DESC").fetchall()
    return [serialize_need(dict(row)) for row in rows]


@app.post("/api/needs")
def create_need(payload: NeedCreate):
    states = json.dumps([state.strip().upper() for state in payload.preferred_states if state.strip()])
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO need_requests (
                requester_name, organization_name, organization_type, email, city, state,
                needed_equipment, intended_use, max_budget, preferred_states, urgency
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.requester_name,
                payload.organization_name,
                payload.organization_type,
                payload.email,
                payload.city,
                payload.state,
                payload.needed_equipment,
                payload.intended_use,
                payload.max_budget,
                states,
                payload.urgency,
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM need_requests WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return serialize_need(dict(row))


@app.get("/api/needs/{need_id}")
def get_need(need_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM need_requests WHERE id = ?", (need_id,)).fetchone()
    need = row_to_dict(row)
    if not need:
        raise HTTPException(status_code=404, detail="Need request not found.")
    return serialize_need(need)


@app.post("/api/ai/categorize-equipment")
def categorize(payload: CategorizeRequest):
    return categorize_equipment(payload)


@app.get("/api/match-needs/{need_id}")
def match_need(need_id: int):
    with get_connection() as conn:
        need = row_to_dict(conn.execute("SELECT * FROM need_requests WHERE id = ?", (need_id,)).fetchone())
        if not need:
            raise HTTPException(status_code=404, detail="Need request not found.")
        return match_need_to_listings(conn, need)


@app.post("/api/dev/seed")
def seed_demo_data():
    from seed import seed_demo

    with get_connection() as conn:
        return seed_demo(conn)


def serialize_listing(row: dict[str, Any]) -> dict[str, Any]:
    return decode_listing_json_fields(row)


def serialize_need(row: dict[str, Any]) -> dict[str, Any]:
    try:
        row["preferred_states"] = json.loads(row.get("preferred_states") or "[]")
    except json.JSONDecodeError:
        row["preferred_states"] = []
    return row
