#!/usr/bin/env bash
# ============================================================================
# Kairos — empaquette le thème Shopify en ZIP + génère le CSV produits démo.
#
# Usage :
#   ./scripts/build-shopify-theme.sh
#   ./scripts/build-shopify-theme.sh https://cdn.kairos.sn    # base URL images
#
# Produits :
#   exports/kairos-theme.zip            — thème prêt à uploader
#   exports/shopify-products-demo.csv   — 8 produits prêts à importer
# ============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BLUE='\033[0;34m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
log() { echo -e "${BLUE}[theme]${NC} $*"; }
ok()  { echo -e "${GREEN}[✓]${NC} $*"; }
die() { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

[[ -d "shopify-theme" ]] || die "shopify-theme/ introuvable"
command -v zip >/dev/null 2>&1 || die "La commande 'zip' est requise."

# URL de base pour les images du CSV. Par défaut : GitHub raw (repo public).
# Shopify ira chercher les images à l'import depuis ces URLs absolues.
IMG_BASE="${1:-https://raw.githubusercontent.com/Boubacar7/kairos-distribution/main/shopify-theme/assets}"

mkdir -p exports
rm -f exports/kairos-theme.zip exports/shopify-products-demo.csv

log "Création du ZIP depuis shopify-theme/…"
(cd shopify-theme && zip -qr "../exports/kairos-theme.zip" . \
  -x "*.DS_Store" -x "README.md")

log "Génération du CSV produits démo (images depuis $IMG_BASE)…"
cat > exports/shopify-products-demo.csv <<EOF
Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Inventory Tracker,Variant Inventory Qty,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Image Src,Image Position,Image Alt Text,SEO Title,SEO Description,Status
glow-skin,Glow Skin Crème,"<p>Hydratation intense, éclat visible en 7 jours. Soin quotidien enrichi en huile d'argan, acide hyaluronique et vitamine E. 50 ml.</p>",Kairos Distribution,Beauté,"beaute,soin-visage",TRUE,Title,Default Title,GLOW-SKIN,shopify,42,deny,manual,24900,32000,TRUE,TRUE,$IMG_BASE/glow-skin.png,1,Glow Skin Crème,Glow Skin Crème,"Hydratation intense, éclat visible en 7 jours.",active
trim-active,Trim Active Plus,"<p>Programme silhouette 28 jours. Complexe drainant à base de plantes, formule non-stimulante. 60 gélules.</p>",Kairos Distribution,Amincissant,"silhouette,minceur",TRUE,Title,Default Title,TRIM-ACTIVE,shopify,35,deny,manual,18500,,TRUE,TRUE,$IMG_BASE/trim-active.png,1,Trim Active Plus,Trim Active Plus,"Programme silhouette 28 jours.",active
curve-up,Curve Up Gel,"<p>Routine tonifiante et raffermissante. Gel à la caféine végétale et beurre de karité. 200 ml.</p>",Kairos Distribution,Postérieur,"tonification,postérieur",TRUE,Title,Default Title,CURVE-UP,shopify,20,deny,manual,27500,,TRUE,TRUE,$IMG_BASE/curve-up.png,1,Curve Up Gel,Curve Up Gel,"Routine tonifiante et raffermissante.",active
lip-glow,Lip & Glow Set,"<p>Pack découverte lèvres + visage. Baume lèvres teinté + huile visage illuminatrice. Pack 2 produits.</p>",Kairos Distribution,Promo,"promo",TRUE,Title,Default Title,LIP-GLOW,shopify,28,deny,manual,15900,22000,TRUE,TRUE,,,,Lip & Glow Set,"Pack découverte lèvres + visage.",active
velvet-body,Velvet Body Milk,"<p>Lait corps soyeux karité + coco. Ultra-nourrissant, parfum fleur de coton. 250 ml.</p>",Kairos Distribution,Beauté,"beaute,corps",TRUE,Title,Default Title,VELVET-BODY,shopify,60,deny,manual,12900,,TRUE,TRUE,,,,Velvet Body Milk,"Lait corps soyeux karité + coco.",active
confidence,Confidence Kit,"<p>Rituel complet beauté + silhouette. Coffret signature, 5 produits hero, livraison offerte.</p>",Kairos Distribution,Promo,"promo,coffret",TRUE,Title,Default Title,CONFIDENCE,shopify,12,deny,manual,54000,72000,TRUE,TRUE,$IMG_BASE/confidence.png,1,Confidence Kit,Confidence Kit,"Rituel complet beauté + silhouette.",active
slim-tea,Slim Detox Tea,"<p>Infusion drainante 21 jours. Mélange artisanal de plantes, une infusion matin et soir. 21 sachets.</p>",Kairos Distribution,Amincissant,"silhouette,infusion",TRUE,Title,Default Title,SLIM-TEA,shopify,80,deny,manual,9500,,TRUE,TRUE,,,,Slim Detox Tea,"Infusion drainante 21 jours.",active
shape-mask,Shape & Firm Masque,"<p>Masque raffermissant express 20 min. Intensif, à poser 2 fois par semaine. 150 ml.</p>",Kairos Distribution,Postérieur,"tonification,masque",TRUE,Title,Default Title,SHAPE-MASK,shopify,25,deny,manual,19900,,TRUE,TRUE,$IMG_BASE/shape-mask.png,1,Shape & Firm Masque,Shape & Firm Masque,"Masque raffermissant express 20 min.",active
EOF

ok "Thème empaqueté        : exports/kairos-theme.zip"
ok "CSV produits démo       : exports/shopify-products-demo.csv"
echo ""
echo "  Installation Shopify :"
echo "    1. Online Store → Themes → Upload ZIP → kairos-theme.zip"
echo "    2. Products → Import → shopify-products-demo.csv"
echo "    3. Customize → tout est déjà prépopulé (hero, avis, retours, catalogue)"
