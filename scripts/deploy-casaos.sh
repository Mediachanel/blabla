#!/usr/bin/env bash
set -Eeuo pipefail

APP_SERVICE="${APP_SERVICE:-app}"
APP_CONTAINER="${APP_CONTAINER:-sisdmk2-app}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.casaos.yml}"
ENV_FILE="${ENV_FILE:-.env.casaos}"
NO_CACHE="${NO_CACHE:-1}"
RUN_DB_CHECK="${RUN_DB_CHECK:-1}"
SKIP_PULL="${SKIP_PULL:-0}"

log() {
  printf '\n==> %s\n' "$*"
}

fail() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

if ! command -v git >/dev/null 2>&1; then
  fail "git tidak ditemukan. Install git dulu di server CasaOS."
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  fail "Docker Compose tidak ditemukan. Install docker compose plugin atau docker-compose."
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  fail "File compose '$COMPOSE_FILE' tidak ditemukan. Jalankan script dari root repo."
fi

if [ ! -f "$ENV_FILE" ]; then
  fail "File env '$ENV_FILE' tidak ditemukan. Salin .env.casaos.example ke .env.casaos lalu isi JWT_SECRET dan MYSQL_PASSWORD."
fi

if [ "$SKIP_PULL" != "1" ]; then
  log "Update kode dari origin/$BRANCH"
  git fetch origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
  else
    git checkout -b "$BRANCH" --track "origin/$BRANCH"
  fi
  git pull --ff-only origin "$BRANCH"
fi

log "Matikan container lama"
"${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

log "Build image CasaOS"
if [ "$NO_CACHE" = "1" ]; then
  "${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache "$APP_SERVICE"
else
  "${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build "$APP_SERVICE"
fi

log "Jalankan container"
"${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

log "Status container"
"${COMPOSE[@]}" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

if [ "$RUN_DB_CHECK" = "1" ]; then
  log "Cek koneksi database dari container"
  docker exec "$APP_CONTAINER" npm run check:mysql
fi

log "Log terakhir aplikasi"
docker logs --tail 80 "$APP_CONTAINER"

log "Selesai. Aplikasi mengikuti APP_PORT di $ENV_FILE."
