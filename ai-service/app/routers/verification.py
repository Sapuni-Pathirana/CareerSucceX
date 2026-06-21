from fastapi import APIRouter

from app.models.schemas import (
    GenerateQuizRequest,
    GenerateQuizResponse,
    GradeQuizRequest,
    GradeQuizResponse,
)
from app.services import ai_service

router = APIRouter(prefix="/ai/verification", tags=["verification"])


@router.post("/generate-quiz", response_model=GenerateQuizResponse)
def generate_quiz(request: GenerateQuizRequest) -> GenerateQuizResponse:
    return ai_service.generate_quiz(request)


@router.post("/grade", response_model=GradeQuizResponse)
def grade_quiz(request: GradeQuizRequest) -> GradeQuizResponse:
    return ai_service.grade_quiz(request)
