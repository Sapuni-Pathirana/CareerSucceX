import json
import logging
import os
import re
import urllib.error
import urllib.request
from typing import Any

from app.services import gemini as gemini_service

logger = logging.getLogger(__name__)


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


def get_provider() -> str:
    explicit = os.getenv("AI_PROVIDER", "").strip().lower()
    if explicit in ("gemini", "groq", "http", "ngrok"):
        provider = (
            "groq"
            if explicit == "groq"
            else "http"
            if explicit in ("http", "ngrok")
            else "gemini"
        )
        if _provider_configured(provider):
            return provider
        return "none"

    if os.getenv("GROQ_API_KEY", "").strip():
        return "groq"
    if (
        os.getenv("HTTP_LLM_BASE_URL", "").strip()
        or os.getenv("OPENAI_API_BASE_URL", "").strip()
        or os.getenv("NGROK_LLM_URL", "").strip()
    ):
        return "http"
    if gemini_service.is_gemini_enabled():
        return "gemini"
    return "none"


def _provider_configured(provider: str) -> bool:
    if provider == "gemini":
        return gemini_service.is_gemini_enabled()
    if provider == "groq":
        return bool(os.getenv("GROQ_API_KEY", "").strip())
    if provider == "http":
        return bool(
            os.getenv("HTTP_LLM_BASE_URL", "").strip()
            or os.getenv("OPENAI_API_BASE_URL", "").strip()
            or os.getenv("NGROK_LLM_URL", "").strip()
        )
    return False


def is_llm_enabled() -> bool:
    return get_provider() != "none"


def is_gemini_enabled() -> bool:
    return get_provider() == "gemini"


def _resolve_http_config() -> tuple[str, str, str] | None:
    provider = get_provider()
    if provider == "groq":
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key:
            return None
        base = "https://api.groq.com/openai/v1"
        model = os.getenv("GROQ_MODEL", os.getenv("HTTP_LLM_MODEL", "llama-3.3-70b-versatile"))
        return base, api_key, model

    if provider != "http":
        return None

    base = (
        os.getenv("HTTP_LLM_BASE_URL", "").strip()
        or os.getenv("OPENAI_API_BASE_URL", "").strip()
        or os.getenv("NGROK_LLM_URL", "").strip()
    )
    if not base:
        return None

    base = base.rstrip("/")
    if not base.endswith("/v1"):
        base = f"{base}/v1"

    api_key = (
        os.getenv("HTTP_LLM_API_KEY", "").strip()
        or os.getenv("OPENAI_API_KEY", "").strip()
        or "not-needed"
    )
    model = os.getenv("HTTP_LLM_MODEL", os.getenv("OPENAI_MODEL", "llama3.2"))
    return base, api_key, model


def _generate_json_http(prompt: str, system: str | None) -> dict[str, Any] | list[Any] | None:
    config = _resolve_http_config()
    if config is None:
        return None

    base, api_key, model = config
    url = f"{base}/chat/completions"

    system_text = (system or "") + "\nRespond with valid JSON only."
    messages = [
        {"role": "system", "content": system_text.strip()},
        {"role": "user", "content": prompt},
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if "ngrok" in base:
        headers["ngrok-skip-browser-warning"] = "true"

    payloads = [
        {
            "model": model,
            "messages": messages,
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
        },
        {
            "model": model,
            "messages": messages,
            "temperature": 0.4,
        },
    ]

    for body in payloads:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            choices = data.get("choices") or []
            if not choices:
                continue
            text = choices[0].get("message", {}).get("content", "") or ""
            parsed = _extract_json(text)
            if parsed is not None:
                return parsed
            logger.warning("HTTP LLM returned non-JSON response")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            logger.warning("HTTP LLM request failed (%s): %s", exc.code, detail[:500])
        except Exception:
            logger.exception("HTTP LLM generation failed")

    return None


def generate_json(prompt: str, system: str | None = None) -> dict[str, Any] | list[Any] | None:
    provider = get_provider()
    if provider == "gemini":
        return gemini_service.generate_json(prompt, system)
    if provider in ("groq", "http"):
        return _generate_json_http(prompt, system)
    return None
