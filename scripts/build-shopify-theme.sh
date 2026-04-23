#!/usr/bin/env bash
# ============================================================================
# Kairos — empaquette le thème Shopify en ZIP prêt à uploader.
#
# Usage :
#   ./scripts/build-shopify-theme.sh
#
# Produit :
#   exports/kairos-theme.zip
# ============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${BLUE}[theme]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

[[ -d "shopify-theme" ]] || die "shopify-theme/ introuvable"
command -v zip >/dev/null 2>&1 || die "La commande 'zip' est requise."

mkdir -p exports
rm -f exports/kairos-theme.zip

log "Création du ZIP depuis shopify-theme/…"
(cd shopify-theme && zip -qr "../exports/kairos-theme.zip" . \
  -x "*.DS_Store" -x "README.md")

ok "Thème empaqueté : exports/kairos-theme.zip"
echo ""
echo "  Prochaine étape : Shopify admin → Online Store → Themes"
echo "  → Add theme → Upload ZIP → sélectionne exports/kairos-theme.zip"
