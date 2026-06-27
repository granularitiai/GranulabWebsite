from __future__ import annotations

import csv
import io
import json
from typing import Any

from pydantic import BaseModel


def protocol_to_csv(data: BaseModel | dict[str, Any]) -> str:
    payload = to_jsonable(data)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["section", "field", "value", "confidence"])
    writer.writeheader()

    write_flat_rows(writer, payload)
    return output.getvalue()


def to_jsonable(data: Any) -> Any:
    if isinstance(data, BaseModel):
        return data.model_dump(mode="json")
    if isinstance(data, list):
        return [to_jsonable(item) for item in data]
    if isinstance(data, dict):
        return {key: to_jsonable(value) for key, value in data.items()}
    return data


def write_flat_rows(
    writer: csv.DictWriter,
    value: Any,
    section: str = "",
    field: str = "",
) -> None:
    if isinstance(value, dict):
        confidence = extract_confidence(value)
        scalar_items = {key: val for key, val in value.items() if not isinstance(val, (dict, list))}
        if scalar_items and field:
            writer.writerow(
                {
                    "section": section,
                    "field": field,
                    "value": json.dumps(scalar_items, ensure_ascii=False),
                    "confidence": confidence,
                }
            )
        for key, nested in value.items():
            if isinstance(nested, (dict, list)):
                write_flat_rows(writer, nested, section or key, key)
        if not scalar_items and not any(isinstance(item, (dict, list)) for item in value.values()) and field:
            writer.writerow({"section": section, "field": field, "value": "", "confidence": confidence})
        return

    if isinstance(value, list):
        if not value:
            writer.writerow({"section": section, "field": field, "value": "[]", "confidence": ""})
            return
        for index, item in enumerate(value, start=1):
            if isinstance(item, (dict, list)):
                next_section = section or "records"
                next_field = f"{field}_{index}" if field else f"record_{index}"
                write_flat_rows(writer, item, next_section, next_field)
            else:
                writer.writerow({"section": section, "field": f"{field}_{index}", "value": item, "confidence": ""})
        return

    writer.writerow({"section": section, "field": field, "value": value, "confidence": ""})


def extract_confidence(value: dict[str, Any]) -> str:
    confidence = value.get("confidence")
    if isinstance(confidence, (float, int, str)):
        return str(confidence)
    return ""
