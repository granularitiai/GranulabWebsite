from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

from ai_service import categorize_equipment, is_scientific_listing
from schemas import CategorizeRequest, SyncSummary


GSA_ENDPOINT = "https://api.gsa.gov/assets/gsaauctions/v2/auctions"
GSA_AUCTIONS_WEB_ENDPOINT = "https://www.ppms.gov/gw/auction/ppms/api/v1/auctions"
GSA_STORAGE_PRESIGNED_ENDPOINT = "https://www.ppms.gov/gw/common/ppms/api/v1/storage/presigned-urls"
GSA_LAB_EQUIPMENT_CATEGORY_CODE = "140"


def sync_gsa_auctions(conn) -> SyncSummary:
    summary = SyncSummary(sync_started_at=datetime.utcnow())
    api_key = os.getenv("GSA_API_KEY")
    if not api_key:
        summary.sync_completed_at = datetime.utcnow()
        summary.errors.append("Missing GSA_API_KEY. Set it before syncing GSA Auctions.")
        return summary

    try:
        listings = _fetch_gsa_lab_equipment_category()
        _attach_gsa_presigned_image_urls(listings)
        summary.total_listings_retrieved = len(listings)
    except Exception as exc:
        summary.sync_completed_at = datetime.utcnow()
        summary.errors.append(f"GSA Auctions request failed: {exc}")
        return summary

    now = datetime.utcnow().isoformat()
    seen_source_ids: set[str] = set()
    for raw in listings:
        if not isinstance(raw, dict):
            continue
        summary.scientific_listings_found += 1
        normalized = normalize_gsa_listing(raw, now)
        source_id = normalized["source_id"]
        if source_id in seen_source_ids:
            summary.duplicates_skipped += 1
            continue
        seen_source_ids.add(source_id)

        existing = conn.execute("SELECT id FROM equipment_listings WHERE source_id = ?", (source_id,)).fetchone()
        if existing:
            _update_listing(conn, existing["id"], normalized)
            summary.listings_updated += 1
        else:
            _insert_listing(conn, normalized)
            summary.listings_added += 1

    if seen_source_ids:
        placeholders = ", ".join("?" for _ in seen_source_ids)
        conn.execute(
            f"""
            DELETE FROM equipment_listings
            WHERE source_type = 'gsa_api'
              AND ingestion_status = 'synced'
              AND source_id NOT IN ({placeholders})
            """,
            tuple(seen_source_ids),
        )

    conn.commit()
    summary.sync_completed_at = datetime.utcnow()
    return summary


def _fetch_gsa_lab_equipment_category() -> list[dict[str, Any]]:
    query = urllib.parse.urlencode(
        {
            "page": 1,
            "size": 250,
            "sort": "AUCTION_END_DATE_TIME_ASC,ASC",
        }
    )
    body = json.dumps(
        {
            "categoryCodeList": [GSA_LAB_EQUIPMENT_CATEGORY_CODE],
            "unCheckedCategoryList": [],
            "auctionSearchTypeAdvanced": "ALL_WORDS",
            "advancedSearchText": "",
            "zipCode": "",
            "radius": "",
            "auctionType": "",
            "minPrice": "",
            "maxPrice": "",
            "bidDeposit": None,
            "saleNumber": "",
            "states": [],
            "auctionStatus": "active",
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{GSA_AUCTIONS_WEB_ENDPOINT}?{query}",
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Referer": "https://www.gsaauctions.gov/auctions/auctions-list?categoryCodes=140&status=active&advanced=false&auctionHome=true",
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))
    listings = payload.get("auctionDTOList")
    return listings if isinstance(listings, list) else []


def _attach_gsa_presigned_image_urls(listings: list[dict[str, Any]]) -> None:
    image_requests = []
    for raw in listings:
        uri = _string(_field(raw, "uri", "ImageURL", "imageURL"))
        auction_id = _string(_field(raw, "auctionId", "AuctionId"))
        lot_name = _string(_field(raw, "lotName", "ItemName", "itemName")) or "auction-image"
        if not uri or not auction_id:
            continue
        image_requests.append(
            {
                "id": auction_id,
                "uri": uri,
                "fileName": _safe_gsa_file_name(lot_name),
            }
        )

    if not image_requests:
        return

    request = urllib.request.Request(
        GSA_STORAGE_PRESIGNED_ENDPOINT,
        data=json.dumps(image_requests).encode("utf-8"),
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Origin": "https://www.gsaauctions.gov",
            "Referer": "https://www.gsaauctions.gov/auctions/auctions-list?categoryCodes=140&status=active&advanced=false&auctionHome=true",
            "User-Agent": "Mozilla/5.0",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return

    if not isinstance(payload, list):
        return

    presigned_by_id = {
        _string(item.get("id")): _string(item.get("presignedUrl"))
        for item in payload
        if isinstance(item, dict)
    }
    for raw in listings:
        auction_id = _string(_field(raw, "auctionId", "AuctionId"))
        presigned_url = presigned_by_id.get(auction_id)
        if presigned_url:
            raw["preSignedURL"] = presigned_url


def normalize_gsa_listing(raw: dict[str, Any], synced_at: str) -> dict[str, Any]:
    sale_no = _string(_field(raw, "SaleNo", "saleNo", "salesNumber"))
    lot_no = _string(_field(raw, "LotNo", "lotNo", "lotNumber"))
    auction_id = _string(_field(raw, "auctionId", "AuctionId"))
    source_url = _string(_field(raw, "ItemDescURL", "itemDescURL"))
    if not source_url and auction_id:
        source_url = f"https://www.gsaauctions.gov/auctions/preview/{auction_id}"
    source_id = (
        _string(_field(raw, "lotId", "LotId"))
        or f"{sale_no}-{lot_no}".strip("-")
        or source_url
        or _string(_field(raw, "ItemName", "itemName", "lotName"))
        or f"unknown-{synced_at}"
    )
    title = _string(_field(raw, "ItemName", "itemName", "lotName")) or "Untitled GSA listing"
    lot_description = _string(_field(raw, "LotDescript", "lotDescript", "lotDescription", "lotInfo", "lotName"))
    location = _field(raw, "location", "Location")
    if not isinstance(location, dict):
        location = {}
    enrichment = categorize_equipment(
        CategorizeRequest(
            title=title,
            lot_description=lot_description,
            agency_name=_string(_field(raw, "AgencyName", "agencyName", "sellingAgency")),
            bureau_name=_string(_field(raw, "BureauName", "bureauName")),
            source_url=source_url,
        )
    )

    return {
        "source_type": "gsa_api",
        "source_id": source_id,
        "source_url": source_url,
        "title": title,
        "cleaned_title": enrichment.cleaned_title,
        "category": enrichment.suggested_category,
        "subcategory": enrichment.suggested_subcategory,
        "description": lot_description,
        "improved_description": enrichment.improved_description,
        "manufacturer": None,
        "model_number": None,
        "condition": "Unknown",
        "estimated_value_range": enrichment.estimated_value_range,
        "current_bid": _float(_field(raw, "HighBidAmount", "highBidAmount", "currentBid")),
        "reserve_price": _float(_field(raw, "Reserve", "reserve", "reserveAmount")),
        "bid_increment": _float(_field(raw, "AucIncrement", "aucIncrement", "bidIncrement")),
        "bidders_count": _int(_field(raw, "BiddersCount", "biddersCount", "numberOfBidders")),
        "availability_type": "Auction",
        "listing_status": "External",
        "sale_number": sale_no,
        "lot_number": lot_no,
        "auction_status": _string(_field(raw, "AuctionStatus", "auctionStatus", "status")),
        "auction_start_date": _datetime_string(_field(raw, "AucStartDt", "aucStartDt", "startDate")),
        "auction_end_date": _datetime_string(_field(raw, "AucEndDt", "aucEndDt", "endDate")),
        "agency_code": _string(_field(raw, "AgencyCode", "agencyCode")),
        "bureau_code": _string(_field(raw, "BureauCode", "bureauCode")),
        "agency_name": _string(_field(raw, "AgencyName", "agencyName", "sellingAgency")),
        "bureau_name": _string(_field(raw, "BureauName", "bureauName")),
        "contract_officer": _string(_field(raw, "ContractOfficer", "contractOfficer")),
        "contact_email": _string(_field(raw, "COEmail", "coEmail")),
        "contact_phone": _string(_field(raw, "COPhone", "coPhone")),
        "property_address_1": _string(_field(raw, "PropertyAddr1", "propertyAddr1", "locationStAddr")) or _string(_field(location, "addressLine1", "line1")),
        "property_address_2": _string(_field(raw, "PropertyAddr2", "propertyAddr2")),
        "property_address_3": _string(_field(raw, "PropertyAddr3", "propertyAddr3")),
        "location_city": _string(_field(raw, "PropertyCity", "propertyCity", "locationCity")) or _string(_field(location, "city")),
        "location_state": _string(_field(raw, "PropertyState", "propertyState", "locationST")) or _string(_field(location, "state", "stateCode")),
        "location_zip": _string(_field(raw, "PropertyZip", "propertyZip", "locationZip")) or _string(_field(location, "zipCode", "zip")),
        "sale_location_city": _string(_field(raw, "LocationCity", "locationCity")),
        "sale_location_state": _string(_field(raw, "LocationST", "locationST")),
        "sale_location_zip": _string(_field(raw, "LocationZip", "locationZip")),
        "lot_description": lot_description,
        "inspection_instruction_1": _string(_field(raw, "Instruction1", "instruction1", "instruction")),
        "inspection_instruction_2": _string(_field(raw, "Instruction2", "instruction2")),
        "inspection_instruction_3": _string(_field(raw, "Instruction3", "instruction3")),
        "image_url": _image_url(_field(raw, "preSignedURL", "presignedUrl", "ImageURL", "imageURL", "uri")),
        "recommended_tags": json.dumps(enrichment.recommended_tags),
        "buyer_use_cases": json.dumps(enrichment.buyer_use_cases),
        "risk_notes": json.dumps(enrichment.risk_notes),
        "scientific_relevance_score": enrichment.scientific_relevance_score,
        "equipment_confidence_score": enrichment.equipment_confidence_score,
        "organization_type": "Government",
        "ingestion_status": "synced",
        "updated_at": synced_at,
        "last_synced_at": synced_at,
    }


def _insert_listing(conn, data: dict[str, Any]) -> None:
    keys = list(data.keys())
    placeholders = ", ".join("?" for _ in keys)
    conn.execute(
        f"INSERT INTO equipment_listings ({', '.join(keys)}) VALUES ({placeholders})",
        tuple(data[key] for key in keys),
    )


def _update_listing(conn, listing_id: int, data: dict[str, Any]) -> None:
    keys = [key for key in data.keys() if key != "source_id"]
    assignments = ", ".join(f"{key} = ?" for key in keys)
    conn.execute(
        f"UPDATE equipment_listings SET {assignments} WHERE id = ?",
        tuple(data[key] for key in keys) + (listing_id,),
    )


def _extract_listing_array(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return []
    for key in ("auctions", "Auctions", "results", "Results", "items", "data"):
        value = payload.get(key)
        if isinstance(value, list):
            return value
    for value in payload.values():
        if isinstance(value, list) and (not value or isinstance(value[0], dict)):
            return value
    return []


def _field(payload: dict[str, Any], *names: str) -> Any:
    for name in names:
        value = payload.get(name)
        if value not in (None, ""):
            return value
    return None


def _string(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        text = json.dumps(value, ensure_ascii=False)
        return text or None
    text = str(value).strip()
    return text or None


def _datetime_string(value: Any) -> str | None:
    text = _string(value)
    if not text:
        return None
    normalized = text.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed.replace(microsecond=0).isoformat()
    except ValueError:
        if len(text) >= 19:
            return text[:19]
        if len(text) >= 10:
            return f"{text[:10]}T00:00:00"
        return text


def _image_url(value: Any) -> str | None:
    text = _string(value)
    if not text:
        return None
    if text.startswith(("http://", "https://")):
        return text
    return f"https://www.gsaauctions.gov/{text.lstrip('/')}"


def _safe_gsa_file_name(value: str) -> str:
    safe = "".join(character for character in value if character.isalnum() or character == " ")
    return safe.strip() or "auction-image"


def _float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(str(value).replace("$", "").replace(",", "").strip())
    except ValueError:
        return None


def _int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(float(str(value).replace(",", "").strip()))
    except ValueError:
        return None
