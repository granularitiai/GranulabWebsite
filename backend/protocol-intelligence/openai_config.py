from __future__ import annotations

import os


def get_openai_api_key() -> str | None:
    raw_key = os.getenv("OPENAI_API_KEY")
    if raw_key is None:
        return None
    cleaned_key = raw_key.strip()
    return cleaned_key or None


def openai_api_key_has_surrounding_whitespace() -> bool:
    raw_key = os.getenv("OPENAI_API_KEY")
    return raw_key is not None and raw_key != raw_key.strip()
