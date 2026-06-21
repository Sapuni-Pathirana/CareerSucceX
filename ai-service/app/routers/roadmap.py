from fastapi import APIRouter

from app.models.schemas import GenerateRoadmapRequest, GenerateRoadmapResponse
from app.services import ai_service

router = APIRouter(prefix="/ai/roadmap", tags=["roadmap"])


@router.post("/generate", response_model=GenerateRoadmapResponse)
def generate_roadmap(request: GenerateRoadmapRequest) -> GenerateRoadmapResponse:
    return ai_service.generate_roadmap(request)
