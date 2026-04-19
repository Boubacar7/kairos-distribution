#!/usr/bin/env bash
# ============================================================================
# Kairos — build de production (frontend + backend) et exécution.
# Pour un vrai déploiement, placer derrière un reverse proxy HTTPS (Nginx/Caddy)
# et fournir les variables d'environnement via votre orchestrateur.
# ============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log() { echo -e "${BLUE}[prod]${NC} $*"; }
ok()  { echo -e "${GREEN}[✓]${NC} $*"; }
die() { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

: "${DATABASE_URL:?DATABASE_URL doit être défini}"
: "${JWT_SECRET:?JWT_SECRET doit être défini}"
: "${NEXT_PUBLIC_API_URL:?NEXT_PUBLIC_API_URL doit être défini}"

log "Build backend…"
(cd backend && npm ci && npx prisma generate && npm run build)
log "Migrations…"
(cd backend && npx prisma migrate deploy)
ok "Backend prêt."

log "Build frontend…"
(cd frontend && npm ci && npm run build)
ok "Frontend prêt."

log "Lancement des services…"
(cd backend  && npm run start:prod) &
BACK_PID=$!
(cd frontend && npm start) &
FRONT_PID=$!

trap 'kill $BACK_PID $FRONT_PID 2>/dev/null || true' INT TERM
wait
