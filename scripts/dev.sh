#!/usr/bin/env bash
# ============================================================================
# Kairos — mode développement (hors Docker, hot reload natif)
# Lance PostgreSQL (Docker) + backend (npm) + frontend (npm) en parallèle.
# Ctrl+C arrête proprement les trois.
# ============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[dev]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

command -v node >/dev/null 2>&1 || die "Node.js requis (≥20)."
command -v npm  >/dev/null 2>&1 || die "npm requis."
command -v docker >/dev/null 2>&1 || die "Docker requis pour la base."

PIDS=()
cleanup() {
  log "Arrêt en cours…"
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  docker stop kairos-dev-db >/dev/null 2>&1 || true
  exit 0
}
trap cleanup INT TERM

log "Démarrage de PostgreSQL (conteneur kairos-dev-db)…"
if docker ps -a --format '{{.Names}}' | grep -q '^kairos-dev-db$'; then
  docker start kairos-dev-db >/dev/null
else
  docker run -d --name kairos-dev-db \
    -e POSTGRES_USER=kairos -e POSTGRES_PASSWORD=kairos -e POSTGRES_DB=kairos \
    -p 5432:5432 postgres:16-alpine >/dev/null
fi
for i in {1..20}; do
  docker exec kairos-dev-db pg_isready -U kairos -d kairos >/dev/null 2>&1 && break
  sleep 1
done
ok "Base prête sur :5432."

if [[ ! -f backend/.env ]]; then
  log "Création de backend/.env…"
  cat > backend/.env <<EOF
DATABASE_URL="postgresql://kairos:kairos@localhost:5432/kairos?schema=public"
JWT_SECRET="dev-secret-change-me"
JWT_EXPIRES_IN="4h"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
EOF
fi

if [[ ! -f frontend/.env.local ]]; then
  log "Création de frontend/.env.local…"
  cp frontend/.env.local.example frontend/.env.local
fi

log "Installation des dépendances backend…"
(cd backend && npm install --silent)
log "Migrations Prisma…"
(cd backend && npx prisma migrate dev --name dev --skip-seed || true)
(cd backend && npm run seed || warn "Seed ignoré.")

log "Installation des dépendances frontend…"
(cd frontend && npm install --silent)

log "Lancement backend (:4000)…"
(cd backend && npm run start:dev) &
PIDS+=($!)

log "Lancement frontend (:3000)…"
(cd frontend && npm run dev) &
PIDS+=($!)

ok "Tout est lancé."
echo ""
echo "  Boutique : http://localhost:3000"
echo "  Admin    : http://localhost:3000/admin  (admin@kairos.local / kairos2026)"
echo "  API      : http://localhost:4000/api"
echo ""
echo "  Ctrl+C pour tout arrêter."

wait
