import logging

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.errors import AIServiceError, LLMRequestError
from app.routers import cv, github, health, interview, roadmap, verification

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CareerSucceX AI Service",
    description="AI microservice for CV analysis, mock interviews, roadmaps, and skill verification.",
    version="1.0.0",
)


@app.exception_handler(LLMRequestError)
async def handle_llm_request_error(_request: Request, exc: LLMRequestError) -> JSONResponse:
    logger.warning("LLM request failed: %s", exc)
    return JSONResponse(
        status_code=503,
        content={"detail": str(exc), "feature": exc.feature},
    )


@app.exception_handler(AIServiceError)
async def handle_ai_service_error(_request: Request, exc: AIServiceError) -> JSONResponse:
    logger.warning("AI required but unavailable: %s", exc)
    return JSONResponse(
        status_code=503,
        content={"detail": str(exc), "feature": exc.feature},
    )


app.include_router(health.router)
app.include_router(cv.router)
app.include_router(github.router)
app.include_router(interview.router)
app.include_router(roadmap.router)
app.include_router(verification.router)
