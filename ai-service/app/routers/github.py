from fastapi import APIRouter

from app.models.schemas import GitHubAnalyzeRequest, GitHubAnalyzeResponse
from app.services import ai_service

router = APIRouter(prefix="/ai/github", tags=["github"])


@router.post("/analyze", response_model=GitHubAnalyzeResponse)
def analyze_github(request: GitHubAnalyzeRequest) -> GitHubAnalyzeResponse:
    return ai_service.analyze_github(request)
