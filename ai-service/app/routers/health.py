from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.services import llm

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    provider = llm.get_provider()
    enabled = llm.is_llm_enabled()
    return HealthResponse(
        status="ok" if enabled else "degraded",
        aiProvider=provider,
        aiEnabled=enabled,
        geminiEnabled=provider == "gemini" and enabled,
    )
