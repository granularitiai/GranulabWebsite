from __future__ import annotations

import sqlite3
from pathlib import Path
import os


DB_PATH = Path(os.getenv("LABLOOP_DB_PATH", Path(__file__).with_name("labloop.db")))


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS equipment_listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT DEFAULT 'gsa_api',
                source_id TEXT NOT NULL UNIQUE,
                source_url TEXT,
                title TEXT NOT NULL,
                cleaned_title TEXT,
                category TEXT DEFAULT 'Other',
                subcategory TEXT,
                description TEXT,
                improved_description TEXT,
                manufacturer TEXT,
                model_number TEXT,
                condition TEXT DEFAULT 'Unknown',
                estimated_value_range TEXT DEFAULT 'Unknown',
                current_bid REAL,
                reserve_price REAL,
                bid_increment REAL,
                bidders_count INTEGER,
                availability_type TEXT DEFAULT 'Auction',
                listing_status TEXT DEFAULT 'External',
                sale_number TEXT,
                lot_number TEXT,
                auction_status TEXT,
                auction_start_date TEXT,
                auction_end_date TEXT,
                agency_code TEXT,
                bureau_code TEXT,
                agency_name TEXT,
                bureau_name TEXT,
                contract_officer TEXT,
                contact_email TEXT,
                contact_phone TEXT,
                property_address_1 TEXT,
                property_address_2 TEXT,
                property_address_3 TEXT,
                location_city TEXT,
                location_state TEXT,
                location_zip TEXT,
                sale_location_city TEXT,
                sale_location_state TEXT,
                sale_location_zip TEXT,
                lot_description TEXT,
                inspection_instruction_1 TEXT,
                inspection_instruction_2 TEXT,
                inspection_instruction_3 TEXT,
                image_url TEXT,
                recommended_tags TEXT DEFAULT '[]',
                buyer_use_cases TEXT DEFAULT '[]',
                risk_notes TEXT DEFAULT '[]',
                scientific_relevance_score INTEGER DEFAULT 0,
                equipment_confidence_score INTEGER DEFAULT 0,
                organization_type TEXT DEFAULT 'Government',
                ingestion_status TEXT DEFAULT 'synced',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_synced_at TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS need_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                requester_name TEXT NOT NULL,
                organization_name TEXT NOT NULL,
                organization_type TEXT NOT NULL,
                email TEXT NOT NULL,
                city TEXT,
                state TEXT,
                needed_equipment TEXT NOT NULL,
                intended_use TEXT,
                max_budget REAL,
                preferred_states TEXT DEFAULT '[]',
                urgency TEXT DEFAULT 'Medium',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    return dict(row) if row is not None else None
