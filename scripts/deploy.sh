#!/usr/bin/env bash
# ============================================================================
# Kairos — déploiement complet en un seul script
# Usage : ./scripts/deploy.sh [up|down|reset|logs|seed|status]
# ============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[kairos]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

check_deps() {
  command -v docker >/dev/null 2>&1 || die "Docker n'est pas installé."
  if docker compose version >/dev/null 2>&1; then
    DC="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    DC="docker-compose"
  else
    die "docker compose introuvable."
  fi
}

cmd_up() {
  check_deps
  log "Build et démarrage des services (db, backend, frontend)…"
  $DC up --build -d
  log "Attente de la base de données…"
  for i in {1..30}; do
    if $DC exec -T db pg_isready -U kairos -d kairos >/dev/null 2>&1; then
      ok "Base de données prête."; break
    fi
    sleep 2
    [[ $i -eq 30 ]] && die "Timeout : la base n'est pas prête."
  done
  log "Application des migrations Prisma…"
  $DC exec -T backend npx prisma migrate deploy || warn "Migrations déjà appliquées."
  log "Seed initial…"
  $DC exec -T backend npm run seed || warn "Seed ignoré (déjà présent ?)"
  ok "Déploiement terminé."
  echo ""
  echo "  Boutique       : http://localhost:3000"
  echo "  Admin custom   : http://localhost:3000/admin  (admin@kairos.sn / kairos2026)"
  echo "  Directus CMS   : http://localhost:8055        (admin@kairos.sn / kairos2026)"
  echo "  API            : http://localhost:4000/api"
  echo "  DB             : postgres://kairos:kairos@localhost:5432/kairos"
}

cmd_down() {
  check_deps
  log "Arrêt des conteneurs…"
  $DC down
  ok "Conteneurs arrêtés."
}

cmd_reset() {
  check_deps
  warn "Cette opération supprime TOUTES les données locales."
  read -rp "Continuer ? (y/N) " ans
  [[ "$ans" =~ ^[yY]$ ]] || { log "Annulé."; exit 0; }
  $DC down -v
  ok "Volumes supprimés. Lancez './scripts/deploy.sh up' pour repartir à zéro."
}

cmd_logs() {
  check_deps
  $DC logs -f --tail=100
}

cmd_seed() {
  check_deps
  log "Re-seed de la base de données…"
  $DC exec -T backend npm run seed
  ok "Seed appliqué."
}

cmd_status() {
  check_deps
  $DC ps
}

usage() {
  cat <<EOF
Kairos — Déploiement

  up       Build, démarre tous les services, applique migrations + seed
  down     Arrête les conteneurs (conserve les données)
  reset    Supprime tous les volumes (données perdues)
  logs     Suit les logs des services
  seed     Relance le seed de la base
  status   État des conteneurs

Exemples :
  ./scripts/deploy.sh up
  ./scripts/deploy.sh logs
  ./scripts/deploy.sh down
EOF
}

case "${1:-up}" in
  up)     cmd_up ;;
  down)   cmd_down ;;
  reset)  cmd_reset ;;
  logs)   cmd_logs ;;
  seed)   cmd_seed ;;
  status) cmd_status ;;
  -h|--help|help) usage ;;
  *) usage; exit 1 ;;
esac
