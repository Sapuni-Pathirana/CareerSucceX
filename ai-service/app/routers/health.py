from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.services import gemini

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", geminiEnabled=gemini.is_gemini_enabled())
