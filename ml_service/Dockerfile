FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    ML_WORKERS=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc g++ libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirement.txt ./

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirement.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn predictscoreforteacheraddfeature:app --host ${HOST:-0.0.0.0} --port ${PORT:-8000} --workers ${ML_WORKERS:-1}"]
