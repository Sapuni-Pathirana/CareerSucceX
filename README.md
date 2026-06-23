# CareerSucceX

Career readiness platform for students and professionals — whether you're applying for jobs, internships, or your next role.

## Features

- CV Analysis & ATS Score
- AI Mock Interviews
- GitHub Repository Analysis
- Skill Gap Detection
- Career Readiness Score
- Learning Roadmap
- Skill Verification

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS, Vite, Recharts |
| Backend | Spring Boot 3, Java 17+, Spring Security, JWT, JPA |
| AI Service | Python FastAPI, Google Gemini |
| Database | PostgreSQL |
| Cache | Redis |
| DevOps | Docker, GitHub Actions |

## Quick Start (Docker)

```bash
cp .env.example .env
# Optional: set GEMINI_API_KEY and GITHUB OAuth credentials in .env

docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api/v1
- AI Service: http://localhost:8000

## Local Development

### Backend
Requires Java 17+ and Maven.

```bash
cd backend
mvn spring-boot:run
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

When running locally, OpenAPI is available at:
- Backend: http://localhost:8080/swagger-ui.html
- AI Service: http://localhost:8000/docs
