from fastapi import APIRouter

from app.models.schemas import AtsKeywordRequest, AtsKeywordResponse, CvEnrichRequest, CvEnrichResponse
from app.services import ai_service

router = APIRouter(prefix="/ai/cv", tags=["cv"])


@router.post("/enrich", response_model=CvEnrichResponse)
def enrich_cv(request: CvEnrichRequest) -> CvEnrichResponse:
    return ai_service.enrich_cv(request)


@router.post("/ats-keywords", response_model=AtsKeywordResponse)
def match_ats_keywords(request: AtsKeywordRequest) -> AtsKeywordResponse:
    return ai_service.match_ats_keywords(request)
