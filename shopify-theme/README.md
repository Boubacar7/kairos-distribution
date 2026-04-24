# Kairos — Thème Shopify

Thème Shopify complet avec **images, produits de démo, avis clients et galerie
communauté pré-intégrés**. Tout est livré tel quel — tu uploads le ZIP et tu
obtiens un site plein, pas un thème vide.

## Contenu empaqueté

| Asset | Origine |
|---|---|
| `assets/cover.jpg` | Photo de couverture de la bannière |
| `assets/glow-skin.png`, `trim-active.png`, `curve-up.png`, `confidence.png`, `shape-mask.png` | 5 visuels produits |
| `assets/community-1.jpg` … `4.jpg` | 4 photos « Retours clients » |
| `assets/theme.css`, `assets/theme.js` | Design tokens + nav interactions |

Ces assets sont **servis depuis Shopify CDN** une fois le thème uploadé, donc
instantanément rapides et hébergés.

## Contenu pré-rempli côté Shopify

| Section | Blocks / contenus livrés avec le thème |
|---|---|
| **Hero bannière** | `cover.jpg` en fallback, 3 lignes éditables (texte/taille/couleur/graisse) |
| **Bandeau catégories** | Lit le menu `main-menu` |
| **Collection en vedette** | Si la collection est vide → 4 ou 8 produits démo baked-in (glow-skin, trim-active, curve-up, confidence, etc.) avec leurs vraies images |
| **Avis clients** | 4 témoignages par défaut (Safi, Fatou, Massara, Awa) dans `templates/index.json` |
| **Retours clients** | 8 emplacements, fallback sur `community-{1..4}.jpg` cyclés |

## Build

```bash
./scripts/build-shopify-theme.sh
```

Produit 2 fichiers dans `exports/` :

- **`kairos-theme.zip`** (~3.7 MB) — à uploader dans Shopify
- **`shopify-products-demo.csv`** — 8 produits prêts à importer (utilise les
  images GitHub raw du repo, fetchées par Shopify au moment de l'import)

Si tes images sont hébergées ailleurs (CDN perso, Cloudflare R2…) :
```bash
./scripts/build-shopify-theme.sh https://cdn.kairos.sn/products
```
→ Le CSV utilisera `https://cdn.kairos.sn/products/glow-skin.png` au lieu de
l'URL GitHub.

## Installation Shopify — 3 étapes

### 1. Upload du thème

1. **Online Store → Themes**
2. **Add theme → Upload ZIP file**
3. `exports/kairos-theme.zip`
4. **Customize** pour prévisualiser (déjà complet)
5. **Publish** pour l'activer

À ce stade, le site affiche la bannière, les produits démo, les 4 avis et 4
photos communauté — **sans rien importer**.

### 2. Import des produits (pour avoir les vrais produits)

1. **Products → All products → Import**
2. `exports/shopify-products-demo.csv`
3. ✅ **Overwrite any current products that have the same handle**
4. **Upload and continue** → **Import products**
5. Shopify télécharge les images depuis les URLs GitHub raw (~30 s)

Une fois les produits importés, le fallback démo disparaît automatiquement et
la section affiche les vrais produits Shopify (même handles, mêmes images).

### 3. Création de la collection `frontpage`

1. **Products → Collections → Create collection**
2. Name: **Frontpage**
3. Handle: `frontpage`
4. Conditions: **Automatic → Title contains `` ` ``** (pour tout inclure)
   *ou* ajoute manuellement les 4 produits à mettre en vedette
5. **Save**

La section « Nos rituels du moment » pointe sur `frontpage` par défaut.

## Personnalisation

### Hero — 3 lignes éditables

**Customize → Home → Hero bannière** expose pour chacune des 3 lignes :
- Texte
- Taille (px) — slider
- Couleur — color picker
- Graisse — Light / Regular / Medium / Semibold / Bold

Pour changer la photo : **Image de couverture → Upload**. Si vide, le fallback
`assets/cover.jpg` reprend.

### Avis clients

**Customize → Home → Avis clients → Add block** pour ajouter, ou clique sur un
bloc existant pour modifier auteur / ville / note / titre / commentaire.

### Retours clients

**Customize → Home → Retours clients → Add block → Photo** puis upload. Si un
bloc n'a pas d'image, il récupère automatiquement `community-1.jpg` à `4.jpg`.

### Couleurs de la marque

**Customize → Theme settings → Couleurs** pour changer bordeaux, rose, crème,
ink. Les variables CSS se propagent partout.

## Multi-devises (FCFA / EUR / USD / CAD)

Un switcher de devise s'affiche dans le header. Il convertit en direct (JS)
les prix saisis en FCFA dans les blocks produits du catalogue éditable.

**Configurer les taux** : Customize → Theme settings → Devises :
- `1 EUR = N FCFA` (défaut 656)
- `1 USD = N FCFA` (défaut 610)
- `1 CAD = N FCFA` (défaut 445)
- Cases à cocher pour afficher/masquer chaque devise
- Devise par défaut

**Côté block produit** : deux modes au choix.
- Remplir `price_fcfa` (nombre) → la conversion automatique s'applique dès
  que l'utilisateur change de devise
- Laisser vide et utiliser `price_label` (texte libre) → affiché tel quel

Les prix Shopify natifs (sur les vrais produits importés) utilisent Shopify
Markets et la devise de la boutique — ils ne sont pas impactés par le switcher.

## Multi-langues (FR / EN)

Le switcher de langue utilise `{% form 'localization' %}`, donc il s'appuie
sur la **vraie** infrastructure Shopify multi-langue.

Pour que ça marche :
1. **Settings → Languages → Add language → Anglais**
2. Publie la langue (sinon les clients ne la voient pas)
3. Traductions : installe l'app **Translate & Adapt** (gratuite, officielle
   Shopify) pour traduire produits / collections / pages

Le thème livre les traductions UI (panier, add to cart, avis, etc.) en FR et
EN dans `locales/fr.default.json` et `locales/en.json`.

## Détail produit

Deux niveaux de fiche selon le cas :

- **Block « Produit » du catalogue éditable** : clic sur la carte → popup
  modal avec l'image, le prix (dans la devise active), la description
  longue (champ `details` rich text) et un CTA « Voir la fiche complète »
  qui pointe vers `/products/xxx` si l'URL est renseignée.

- **Vrai produit Shopify** (`/products/xxx`) : template `product.json`
  rend `sections/main-product.liquid` avec image, prix, description
  (affichée sous un kicker « Description »), sélecteur quantité et
  bouton Add to cart.

## Limites du starter

Pas encore dans ce thème :
- Sélecteur de variantes (tailles/couleurs) sur la page produit
- Drawer panier animé (panier = page `/cart`)
- Comptes clients customisés
- Popup newsletter, mega-menu, sticky cart

Ajoute-les au fil de l'eau ou commande un développement Shopify ciblé.
