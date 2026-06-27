from __future__ import annotations

import os
import socket
from typing import Any

import httpx
from openai import OpenAI

from openai_config import get_openai_api_key, openai_api_key_has_surrounding_whitespace


def run_openai_diagnostics() -> dict[str, Any]:
    api_key = get_openai_api_key()
    result: dict[str, Any] = {
        "openai_api_key_present": bool(api_key),
        "openai_api_key_had_surrounding_whitespace": openai_api_key_has_surrounding_whitespace(),
        "openai_model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "dns": {"ok": False, "address": None, "error": None},
        "https": {"ok": False, "status_code": None, "error": None},
        "authenticated_model_call": {"ok": False, "error": None},
    }

    try:
        result["dns"]["address"] = socket.getaddrinfo("api.openai.com", 443)[0][4][0]
        result["dns"]["ok"] = True
    except Exception as exc:
        result["dns"]["error"] = format_error(exc)

    try:
        response = httpx.get("https://api.openai.com/v1/models", timeout=15)
        result["https"]["status_code"] = response.status_code
        result["https"]["ok"] = response.status_code in {200, 401}
    except Exception as exc:
        result["https"]["error"] = format_error(exc)

    if api_key:
        try:
            response = OpenAI(api_key=api_key, timeout=30).chat.completions.create(
                model=result["openai_model"],
                messages=[{"role": "user", "content": "Return OK"}],
                max_tokens=5,
            )
            result["authenticated_model_call"]["ok"] = bool(response.choices)
        except Exception as exc:
            result["authenticated_model_call"]["error"] = format_error(exc)

    return result


def format_error(exc: Exception) -> str:
    cause = getattr(exc, "__cause__", None)
    if cause:
        return f"{type(exc).__name__}: {exc} | cause={type(cause).__name__}: {cause}"
    return f"{type(exc).__name__}: {exc}"
