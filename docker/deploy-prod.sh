#!/usr/bin/env sh
set -eu

ENV_FILE="${1:-.env.docker}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file '$ENV_FILE' was not found. Copy '.env.docker.example' first." >&2
  exit 1
fi

BACKEND_REPLICAS="$(grep -E '^BACKEND_REPLICAS=' "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- || true)"
ML_REPLICAS="$(grep -E '^ML_REPLICAS=' "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- || true)"

BACKEND_REPLICAS="${BACKEND_REPLICAS:-1}"
ML_REPLICAS="${ML_REPLICAS:-1}"

docker compose \
  --env-file "$ENV_FILE" \
  -f docker-compose.prod.yml \
  up -d --build --remove-orphans \
  --scale "backend=${BACKEND_REPLICAS}" \
  --scale "ml-service=${ML_REPLICAS}"
