# Kairos — Thème Shopify

Thème Shopify porté du prototype **My body goal / By Kairos.Distribution**
(Claude Design handoff). Palette bordeaux + rose poudré + crème, typographie
Fraunces (display) + Inter (UI), hero image pleine largeur avec titre en haut à
gauche et CTAs en bas à gauche.

## Contenu

| Dossier | Rôle |
|---|---|
| `assets/` | `theme.css` (design tokens + composants), `theme.js` (scroll header, menu mobile) |
| `config/` | `settings_schema.json` (options du thème), `settings_data.json` (valeurs par défaut) |
| `layout/theme.liquid` | Gabarit racine (`<html>`), charge les fonts Google + `theme.css` |
| `locales/` | Traductions FR (défaut) et EN |
| `sections/` | Sections Liquid (header, footer, image-banner, featured-collection, main-product, main-collection, main-cart, etc.) |
| `snippets/` | `card-product.liquid` |
| `templates/` | JSON : `index`, `product`, `collection`, `cart`, `page`, `404`, `search`, `list-collections` |

## Installation dans Shopify

### Option A — ZIP upload (le plus simple)

```bash
# Depuis la racine du dépôt
cd shopify-theme
zip -r ../kairos-theme.zip .
cd ..
```

Puis dans l'admin Shopify :
1. **Online Store → Themes**
2. **Add theme → Upload ZIP file**
3. Sélectionne `kairos-theme.zip`
4. Clique **Customize** pour prévisualiser
5. Clique **Publish** quand tu es prêt à remplacer le thème actif

### Option B — Shopify CLI (recommandé si tu modifies souvent le thème)

```bash
# Une seule fois
npm install -g @shopify/cli @shopify/theme

# Dans shopify-theme/
cd shopify-theme
shopify theme dev --store=<ton-store>.myshopify.com
```

La CLI ouvre une preview live (hot reload) sur un port local et te connecte à
ta boutique de développement.

```bash
# Quand tu veux pousser :
shopify theme push --unpublished         # ajoute le thème en mode brouillon
shopify theme push --live                # remplace le thème actif (attention)
```

## Configuration post-installation

### 1. Menus

**Online Store → Navigation** :
- `main-menu` : Accueil, Produits, Avis, Support (pour le header et le
  bandeau catégories)
- `footer` : liens du footer

Alternative pour un bandeau catégories thématique : créer un menu
`categories` avec : Tous (/collections/all), Beauté, Silhouette, Tonification,
Promos → puis dans la section "Bandeau catégories" choisir ce menu.

### 2. Collections

Crée ces collections automatiques dans **Products → Collections** :

| Nom | Règle |
|---|---|
| Beauté | Type = `Beauté` |
| Silhouette | Type = `Amincissant` |
| Tonification | Type = `Postérieur` |
| Promos | Compare-at-price > Price |
| Frontpage | Manuelle, 4 produits en vedette |

### 3. Hero

**Customize → Home page → Hero bannière** :
- Image : upload ta photo de couverture (format portrait recommandé, par
  exemple 868×1280 comme la photo du prototype)
- Titre : `Mybodygoal`
- Sous-titre : `By Kairos.Distribution`
- Eyebrow : `Beauté · Silhouette · Confiance`
- Bouton 1 : `Voir les produits →` → `/collections/all`
- Bouton 2 : `Avis clients` → `/pages/avis`

### 4. Pages

**Online Store → Pages** :
- Avis — témoignages clients
- Support — WhatsApp, email, FAQ
- Livraison & retours
- CGV
- Mentions légales

### 5. Couleurs

**Customize → Theme settings → Couleurs** te permet de modifier les 5 couleurs
de la palette (bordeaux, bordeaux foncé, rose poudré, crème, encre). Le CSS
utilise des variables `:root` : pour que les couleurs soient vraiment dynamiques
il faudrait injecter les settings dans `layout/theme.liquid` via un bloc
`<style>`. À ajouter si besoin.

## Devise FCFA + EUR + USD

Shopify gère le multi-devises via **Settings → Markets**. Active les marchés
Europe et US ; Shopify convertit automatiquement les prix affichés en fonction
de la géolocalisation du visiteur. Le code `{{ price | money }}` dans les
templates utilise la devise active.

Pour un sélecteur manuel, installe l'app **Geolocation** (officielle Shopify)
ou utilise le selector natif de ton thème.

## Paiement — mobile money local

Les paiements Wave / Orange Money / Moov nécessitent une app :
- **PayDunya** : Shopify App Store → PayDunya for Shopify
- **CinetPay** : Shopify App Store → CinetPay for Shopify
- **Flutterwave** : Shopify App Store → Flutterwave for Shopify

Ajoute aussi "Paiement à la livraison" via **Settings → Payments → Manual
payment methods → Cash on delivery**.

## Modifier le thème

Les couleurs Kairos sont dans `assets/theme.css` en tête :
```css
:root {
  --bordeaux: #6d1e3a;
  --rose-100: #f5d9d3;
  --cream: #fbf4ef;
  ...
}
```

Changer une de ces variables suffit à repeindre toute la boutique.

## Limites connues du starter

Ce starter couvre le parcours de base. Il n'inclut **pas** encore :
- Sélecteur de variantes (taille/couleur) — le formulaire `main-product`
  postule une variante unique
- Reviews intégrés (utilise l'app Judge.me)
- Pagination stylée — utilise `default_pagination` Shopify
- Mega-menu, popup newsletter, sticky cart drawer
- Comptes clients stylés (`templates/customers/*` non fournis)

Ajoute-les au fur et à mesure, ou commande un développement Shopify ciblé.
