from __future__ import annotations

import json
from datetime import datetime, timedelta


def seed_demo(conn) -> dict:
    samples = [
        {
            "source_id": "DEMO-001",
            "title": "Thermo Fisher Ultra Low Temperature Freezer",
            "cleaned_title": "Thermo Fisher Ultra Low Temperature Freezer",
            "category": "Freezer",
            "description": "Surplus cold storage equipment from a federal lab.",
            "improved_description": "Ultra-low freezer listing that may support sample storage or teaching lab infrastructure.",
            "current_bid": 850.0,
            "bidders_count": 4,
            "auction_status": "Active",
            "auction_end_date": (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "agency_name": "National Institutes of Health",
            "location_city": "Bethesda",
            "location_state": "MD",
            "scientific_relevance_score": 92,
            "equipment_confidence_score": 88,
            "source_url": "https://gsaauctions.gov/",
            "recommended_tags": ["Freezer", "Cold Storage", "GSA Auction"],
        },
        {
            "source_id": "DEMO-002",
            "title": "Olympus Research Microscope System",
            "cleaned_title": "Olympus Research Microscope System",
            "category": "Microscope",
            "description": "Microscope surplus listing with inspection required.",
            "improved_description": "Research microscope listing relevant to teaching labs, imaging workflows, and inspection use cases.",
            "current_bid": 1200.0,
            "bidders_count": 7,
            "auction_status": "Active",
            "auction_end_date": (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "agency_name": "Department of Agriculture",
            "location_city": "Ames",
            "location_state": "IA",
            "scientific_relevance_score": 95,
            "equipment_confidence_score": 91,
            "source_url": "https://gsaauctions.gov/",
            "recommended_tags": ["Microscope", "Research", "GSA Auction"],
        },
        {
            "source_id": "DEMO-003",
            "title": "Bio-Rad Thermal Cycler PCR Instrument",
            "cleaned_title": "Bio-Rad Thermal Cycler PCR Instrument",
            "category": "PCR Machine",
            "description": "Thermal cycler listed as government surplus.",
            "improved_description": "PCR thermal cycler listing that may be relevant for molecular biology education or R&D workflows.",
            "current_bid": 430.0,
            "bidders_count": 2,
            "auction_status": "Preview",
            "auction_end_date": (datetime.utcnow() + timedelta(days=12)).strftime("%Y-%m-%d"),
            "agency_name": "Department of Veterans Affairs",
            "location_city": "Durham",
            "location_state": "NC",
            "scientific_relevance_score": 90,
            "equipment_confidence_score": 84,
            "source_url": "https://gsaauctions.gov/",
            "recommended_tags": ["PCR Machine", "Molecular Biology", "GSA Auction"],
        },
    ]
    added = 0
    now = datetime.utcnow().isoformat()
    for sample in samples:
        if conn.execute("SELECT id FROM equipment_listings WHERE source_id = ?", (sample["source_id"],)).fetchone():
            continue
        sample = {
            **sample,
            "source_type": "gsa_api",
            "availability_type": "Auction",
            "listing_status": "External",
            "condition": "Unknown",
            "estimated_value_range": "Unknown",
            "risk_notes": json.dumps([
                "Verify working condition before bidding.",
                "Review inspection instructions directly on GSA.",
                "Do not assume equipment is functional unless explicitly stated.",
            ]),
            "buyer_use_cases": json.dumps(["Research operations", "STEM education"]),
            "recommended_tags": json.dumps(sample["recommended_tags"]),
            "last_synced_at": now,
            "ingestion_status": "seeded",
        }
        keys = list(sample.keys())
        conn.execute(
            f"INSERT INTO equipment_listings ({', '.join(keys)}) VALUES ({', '.join('?' for _ in keys)})",
            tuple(sample[key] for key in keys),
        )
        added += 1
    conn.commit()
    return {"seeded": added}
