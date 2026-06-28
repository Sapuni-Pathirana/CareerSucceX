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
| AI Service | Python FastAPI (Gemini, Groq, Grok/xAI, or OpenAI-compatible HTTP) |
| Database | PostgreSQL |
| Cache | Redis |
| DevOps | Docker, GitHub Actions |

## Quick Start (Docker — production build)

Use this for a full production-like demo. **UI changes require rebuild** (`--build`).

```bash
cp .env.example .env
# Optional: set AI provider and GitHub OAuth credentials in .env

docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api/v1
- AI Service: http://localhost:8000

## Development with Docker (save & reload)

Use this while editing the UI — **no rebuild** after each change.

```bash

```

Edit files in `frontend/` and save — the browser refreshes automatically (Vite hot reload).

Stop the production frontend first if it is already running on port 5173.

## GitHub connect (per user)

Each logged-in user connects **their own** GitHub account. The app stores one encrypted OAuth token per user.

1. Create a [GitHub OAuth App](https://github.com/settings/developers) (OAuth Apps → New OAuth App).
2. Set **Authorization callback URL** to:
   `http://localhost:8080/api/v1/github/callback`
3. Add credentials to `.env`:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_REDIRECT_URI=http://localhost:8080/api/v1/github/callback
   ```
4. Restart the backend (`docker compose ... up -d --build backend` or `mvn spring-boot:run`).
5. Log in as a user → **Analyze** → **Connect GitHub** → authorize on GitHub.

Repeat with another account to verify each user gets their own connection and analysis.

## AI provider (required — Gemini, Groq, Grok, or HTTP)

CareerSucceX is **AI-powered**. CV analysis, GitHub analysis, interviews, roadmaps, and quizzes all call Grok (or your configured provider). There is **no rule-based fallback** — if AI is not configured or Grok fails, analysis returns an error instead of fake results.

Set **one** provider in `.env`:

### Option A — Grok / xAI (recommended)

```env
AI_PROVIDER=grok
GROK_API_KEY=your_xai_api_key
GROK_MODEL=grok-4-1-fast-non-reasoning
```

Get a key at [console.x.ai](https://console.x.ai). You can also use `XAI_API_KEY` instead of `GROK_API_KEY`.

**Important:** xAI requires prepaid API credits on your team account. If analysis fails with a credits/permission error, open [console.x.ai](https://console.x.ai) → Billing and add credits, then retry.

Restart the AI service: `docker compose up -d --build ai-service`

Health check: `http://localhost:8000/health` should show `"aiProvider":"grok","aiEnabled":true`.

### Option B — Groq (cloud, **free tier** — best free option)

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Get a free key at [console.groq.com](https://console.groq.com) (sign up → **API Keys** → Create). No credit card required for the free tier.

### Option C — Google Gemini (**free tier**)

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
```

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### Option D — OpenAI-compatible HTTP (e.g. local Ollama)

Point at any OpenAI-compatible endpoint (local Ollama, etc.):

```env
AI_PROVIDER=http
HTTP_LLM_BASE_URL=http://localhost:11434/v1
HTTP_LLM_MODEL=llama3.2
HTTP_LLM_API_KEY=
```

## Local Development (without Docker frontend)

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