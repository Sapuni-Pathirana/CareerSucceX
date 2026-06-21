from fastapi import APIRouter

from app.models.schemas import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    SummarizeInterviewRequest,
    SummarizeInterviewResponse,
)
from app.services import ai_service

router = APIRouter(prefix="/ai/interview", tags=["interview"])


@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
def generate_questions(request: GenerateQuestionsRequest) -> GenerateQuestionsResponse:
    return ai_service.generate_questions(request)


@router.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
def evaluate_answer(request: EvaluateAnswerRequest) -> EvaluateAnswerResponse:
    return ai_service.evaluate_answer(request)


@router.post("/summarize", response_model=SummarizeInterviewResponse)
def summarize_interview(request: SummarizeInterviewRequest) -> SummarizeInterviewResponse:
    return ai_service.summarize_interview(request)
