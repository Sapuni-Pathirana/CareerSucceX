import json
import logging
import os
import re
from typing import Any

logger = logging.getLogger(__name__)

_model = None


def is_gemini_enabled() -> bool:
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


def _get_model():
    global _model
    if _model is not None:
        return _model
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        _model = genai.GenerativeModel(model_name)
        return _model
    except Exception:
        logger.exception("Failed to initialize Gemini model")
        return None


def _extract_json(text: str) -> dict[str, Any] | list[Any] | None:
    cleaned = text.strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                pass
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                pass
    return None


def generate_json(prompt: str, system: str | None = None) -> dict[str, Any] | list[Any] | None:
    model = _get_model()
    if model is None:
        return None

    full_prompt = prompt
    if system:
        full_prompt = f"{system}\n\n{prompt}"

    try:
        response = model.generate_content(
            full_prompt,
            generation_config={
                "temperature": 0.4,
                "response_mime_type": "application/json",
            },
        )
        text = getattr(response, "text", None) or ""
        if not text and response.candidates:
            parts = response.candidates[0].content.parts
            text = "".join(getattr(part, "text", "") or "" for part in parts)
        parsed = _extract_json(text)
        if parsed is None:
            logger.warning("Gemini returned non-JSON response")
        return parsed
    except Exception:
        logger.exception("Gemini generation failed")
        return None
