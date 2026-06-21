import logging

from dotenv import load_dotenv
from fastapi import FastAPI

from app.routers import cv, health, interview, roadmap, verification

load_dotenv()

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="CareerSucceX AI Service",
    description="AI microservice for CV analysis, mock interviews, roadmaps, and skill verification.",
    version="1.0.0",
)

app.include_router(health.router)
app.include_router(cv.router)
app.include_router(interview.router)
app.include_router(roadmap.router)
app.include_router(verification.router)
