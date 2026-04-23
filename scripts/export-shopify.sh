#!/usr/bin/env bash
# ============================================================================
# Kairos — exporter les produits au format CSV Shopify.
#
# Usage :
#   ./scripts/export-shopify.sh                        # URLs d'images relatives
#   ./scripts/export-shopify.sh https://kairos.sn      # URLs absolues (recommandé)
#
# Fichier produit :
#   backend/exports/shopify-products.csv
# ============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${BLUE}[shopify]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

PUBLIC_URL="${1:-}"

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  die "docker compose introuvable."
fi

if ! $DC ps --services --filter "status=running" | grep -q '^backend$'; then
  warn "Le service backend n'est pas en cours d'exécution."
  log "Démarre-le avec ./scripts/deploy.sh up puis relance."
  exit 1
fi

mkdir -p backend/exports

if [[ -n "$PUBLIC_URL" ]]; then
  log "Export Shopify avec URL publique : $PUBLIC_URL"
  $DC exec -T -e "PUBLIC_URL=$PUBLIC_URL" backend npm run export:shopify
else
  log "Export Shopify (URLs d'images relatives)"
  $DC exec -T backend npm run export:shopify
fi

OUT="backend/exports/shopify-products.csv"
if [[ -f "$OUT" ]]; then
  ok "Fichier prêt : $OUT ($(wc -l < "$OUT") lignes)"
  echo ""
  echo "  Prochaine étape : Shopify admin → Products → Import → glisser-déposer"
  echo "  Voir docs/shopify-migration.md pour la checklist complète."
else
  die "L'export a échoué (fichier absent)."
fi
