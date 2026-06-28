import json
import logging
import os
import re
import socket
import time
import urllib.error
import urllib.request
from typing import Any

from app.errors import LLMRequestError
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


def _repair_truncated_json(text: str) -> dict[str, Any] | list[Any] | None:
    cleaned = text.strip()
    if not cleaned:
        return None
    # Drop a trailing incomplete string or key/value fragment.
    cleaned = re.sub(r',\s*"[^"]*$', "", cleaned)
    cleaned = re.sub(r',\s*$', "", cleaned)
    open_curly = cleaned.count("{") - cleaned.count("}")
    open_square = cleaned.count("[") - cleaned.count("]")
    if open_curly <= 0 and open_square <= 0:
        return None
    attempt = cleaned + ("]" * max(open_square, 0)) + ("}" * max(open_curly, 0))
    try:
        return json.loads(attempt)
    except json.JSONDecodeError:
        return None


def _try_parse_llm_text(text: str) -> dict[str, Any] | list[Any] | None:
    if not text or not text.strip():
        return None
    parsed = _extract_json(text)
    if parsed is not None:
        return parsed
    return _repair_truncated_json(text)


def _salvage_from_error_detail(detail: str) -> dict[str, Any] | list[Any] | None:
    try:
        payload = json.loads(detail)
    except json.JSONDecodeError:
        return None
    error = payload.get("error")
    if not isinstance(error, dict):
        return None
    failed = error.get("failed_generation")
    if isinstance(failed, str) and failed.strip():
        parsed = _try_parse_llm_text(failed)
        if parsed is not None:
            logger.info("Recovered partial JSON from provider failed_generation field")
            return parsed
    return None


def _provider_label() -> str:
    provider = get_provider()
    if provider == "groq":
        return "Groq"
    if provider == "grok":
        return "xAI"
    return "LLM"


def _grok_api_key() -> str:
    return os.getenv("GROK_API_KEY", "").strip() or os.getenv("XAI_API_KEY", "").strip()


def get_provider() -> str:
    explicit = os.getenv("AI_PROVIDER", "").strip().lower()
    if explicit in ("gemini", "groq", "grok", "http", "ngrok"):
        provider = (
            "groq"
            if explicit == "groq"
            else "grok"
            if explicit == "grok"
            else "http"
            if explicit in ("http", "ngrok")
            else "gemini"
        )
        if _provider_configured(provider):
            return provider
        return "none"

    if os.getenv("GROQ_API_KEY", "").strip():
        return "groq"
    if _grok_api_key():
        return "grok"
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
    if provider == "grok":
        return bool(_grok_api_key())
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

    if provider == "grok":
        api_key = _grok_api_key()
        if not api_key:
            return None
        base = "https://api.x.ai/v1"
        model = os.getenv(
            "GROK_MODEL",
            os.getenv("HTTP_LLM_MODEL", "grok-4-1-fast-non-reasoning"),
        )
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


def _format_http_error(status_code: int, detail: str, model: str) -> str:
    provider = get_provider()
    label = _provider_label()
    message = detail
    error_code = ""
    try:
        payload = json.loads(detail)
        error_obj = payload.get("error")
        if isinstance(error_obj, dict):
            message = str(error_obj.get("message") or error_obj)
            error_code = str(error_obj.get("code") or "")
        else:
            message = str(error_obj or payload.get("detail") or detail)
            error_code = str(payload.get("code") or "")
        if error_code == "permission-denied" or "doesn't have any credits" in message.lower():
            return (
                "Your xAI account has no API credits yet. "
                "Add credits at https://console.x.ai (Billing), then retry analysis."
            )
        if error_code == "json_validate_failed" and provider == "groq":
            return (
                "Groq could not produce complete JSON for this analysis. "
                "Retry in a moment; if it persists, shorten the CV or switch GROQ_MODEL."
            )
        if "model not found" in message.lower():
            if provider == "groq":
                return (
                    f"Groq model '{model}' is unavailable. "
                    f"Set GROQ_MODEL to llama-3.3-70b-versatile in .env."
                )
            return (
                f"xAI model '{model}' is unavailable. "
                f"Set GROK_MODEL to a current model such as grok-4-1-fast-non-reasoning in .env."
            )
    except json.JSONDecodeError:
        pass

    if status_code == 401:
        if provider == "groq":
            return "Invalid Groq API key. Check GROQ_API_KEY in .env."
        return "Invalid xAI API key. Check GROK_API_KEY in .env."
    if status_code == 429:
        if provider == "groq":
            return (
                f"{label} rate limit reached. The service will retry automatically; "
                "if this persists, wait 1–2 minutes or check usage at console.groq.com."
            )
        return f"{label} rate limit reached. Wait a moment and try again."
    return message[:500] if message else f"{label} request failed with HTTP {status_code}"


def _network_error_message(label: str, exc: BaseException) -> str:
    reason = getattr(exc, "reason", None)
    if isinstance(reason, socket.gaierror) or "Name or service not known" in str(exc):
        return (
            f"Cannot reach {label} API (network/DNS issue). "
            "Ensure Docker has internet access, then retry analysis."
        )
    if isinstance(exc, (socket.timeout, TimeoutError)) or "timed out" in str(exc).lower():
        return f"{label} request timed out. Retry in a moment."
    return f"Network error while calling {label}: {exc}"


def _retry_wait_seconds(exc: urllib.error.HTTPError, attempt: int) -> float:
    headers = getattr(exc, "headers", None)
    if headers:
        retry_after = headers.get("Retry-After") or headers.get("retry-after")
        if retry_after:
            try:
                return min(max(float(retry_after), 2.0), 60.0)
            except ValueError:
                pass
    return min(5.0 * (2**attempt), 45.0)


def _post_chat_completion(
    url: str,
    body: dict[str, Any],
    headers: dict[str, str],
    *,
    timeout: int = 120,
    retries: int = 3,
    rate_limit_retries: int = 4,
) -> dict[str, Any]:
    network_attempt = 0
    rate_limit_attempt = 0
    while True:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and rate_limit_attempt < rate_limit_retries:
                wait = _retry_wait_seconds(exc, rate_limit_attempt)
                rate_limit_attempt += 1
                logger.warning(
                    "HTTP LLM rate limited (attempt %s/%s), waiting %.1fs",
                    rate_limit_attempt,
                    rate_limit_retries,
                    wait,
                )
                exc.read()
                time.sleep(wait)
                continue
            raise
        except (urllib.error.URLError, socket.timeout, TimeoutError, socket.gaierror) as exc:
            if network_attempt < retries - 1:
                network_attempt += 1
                logger.warning(
                    "HTTP LLM network error (attempt %s/%s) for %s: %s",
                    network_attempt,
                    retries,
                    url,
                    exc,
                )
                time.sleep(1.0 * network_attempt)
                continue
            raise exc
    raise RuntimeError("HTTP LLM request failed without a response")


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
        "User-Agent": "CareerSucceX-AI-Service/1.0",
    }
    if "ngrok" in base:
        headers["ngrok-skip-browser-warning"] = "true"

    max_tokens = int(os.getenv("LLM_MAX_TOKENS", "8192"))
    label = _provider_label()
    payloads: list[dict[str, Any]] = [
        {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        },
        {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": max_tokens,
        },
    ]

    last_error: str | None = None
    last_status: int | None = None

    for i, body in enumerate(payloads):
        try:
            data = _post_chat_completion(url, body, headers)
            choices = data.get("choices") or []
            if not choices:
                last_error = f"{label} returned an empty response"
                continue
            text = choices[0].get("message", {}).get("content", "") or ""
            parsed = _try_parse_llm_text(text)
            if parsed is not None:
                return parsed
            last_error = f"{label} response was not valid JSON"
            logger.warning("HTTP LLM returned non-JSON response: %s", text[:300])
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            last_status = exc.code
            salvaged = _salvage_from_error_detail(detail)
            if salvaged is not None:
                return salvaged
            last_error = _format_http_error(exc.code, detail, model)
            logger.warning("HTTP LLM request failed (%s): %s", exc.code, detail[:500])
            if exc.code in (401, 403):
                break
            if exc.code in (502, 503, 504) and i < len(payloads) - 1:
                time.sleep(3.0)
                continue
        except (urllib.error.URLError, socket.timeout, TimeoutError, socket.gaierror) as exc:
            last_error = _network_error_message(label, exc)
            logger.warning("HTTP LLM network error after retries: %s", exc)
        except Exception:
            logger.exception("HTTP LLM generation failed")
            last_error = f"Unexpected error while calling {label}"

    if last_error:
        raise LLMRequestError(last_error, status_code=last_status)
    return None


def generate_json(prompt: str, system: str | None = None) -> dict[str, Any] | list[Any] | None:
    provider = get_provider()
    if provider == "gemini":
        return gemini_service.generate_json(prompt, system)
    if provider in ("groq", "grok", "http"):
        return _generate_json_http(prompt, system)
    return None
