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
| AI Service | Python FastAPI (Gemini, Groq, or OpenAI-compatible via ngrok) |
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
docker compose -f docker-compose.yml -f docker-compose.dev.yml up postgres redis ai-service backend frontend-dev
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

## AI provider (Gemini, Groq, or ngrok)

The AI service supports three providers. Set **one** in `.env`:

### Option A — ngrok + local LLM (Ollama)

Use this when you do not want a Gemini API key. Run a local model and expose it with [ngrok](https://ngrok.com/):

```bash
# Terminal 1 — start Ollama and pull a model
ollama pull llama3.2
ollama serve

# Terminal 2 — tunnel Ollama (default port 11434)
ngrok http 11434
```

Copy the ngrok HTTPS URL (e.g. `https://abc123.ngrok-free.app`) into `.env`:

```env
AI_PROVIDER=http
HTTP_LLM_BASE_URL=https://abc123.ngrok-free.app/v1
HTTP_LLM_MODEL=llama3.2
HTTP_LLM_API_KEY=
```

Restart the AI service: `docker compose up -d --build ai-service`

Health check: `http://localhost:8000/health` should show `"aiProvider":"http","aiEnabled":true`.

### Option B — Groq (cloud, free tier)

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Get a key at [console.groq.com](https://console.groq.com).

### Option C — Google Gemini

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
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