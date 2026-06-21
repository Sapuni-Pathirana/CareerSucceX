FROM python:3.12-slim

WORKDIR /app

ENV PIP_DEFAULT_TIMEOUT=300 \
    PIP_RETRIES=10 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install in stages: lightweight core first, then Gemini SDK (heavier deps)
RUN pip install --upgrade pip setuptools wheel \
    && pip install --default-timeout=300 --retries=10 \
        fastapi==0.115.6 uvicorn[standard]==0.32.1 pydantic==2.10.3 python-dotenv==1.0.1 \
    && pip install --default-timeout=300 --retries=10 \
        google-generativeai==0.8.3

COPY app ./app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
