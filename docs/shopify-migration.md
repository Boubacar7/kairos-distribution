# Migration vers Shopify — Checklist Kairos

Guide pas à pas pour passer de l'installation auto-hébergée actuelle (Next.js +
NestJS + Postgres + Directus) à **Shopify**.

Ordre recommandé : 1 → 10. Chaque étape est courte ; compte 1 à 2 jours au total
pour une boutique avec 20 produits.

---

## 1. Choisir le plan Shopify

| Plan | Prix/mois | Commission CB | Pour qui |
|---|---|---|---|
| **Basic** | 29 € | ~2,9 % + 0,30 € | Lancement, < 50k € CA/an |
| **Shopify** | 79 € | ~2,6 % + 0,30 € | Croissance, 2-3 utilisateurs |
| **Advanced** | 299 € | ~2,4 % + 0,30 € | > 200k € CA/an, reporting avancé |

**Recommandation Kairos** : démarre en **Basic**, bascule en Shopify si le CA
dépasse 50 k€/an. Commence par l'essai gratuit 14 jours → https://shopify.com

Pays de la boutique : **Sénégal** (ou ton pays). Devise : **FCFA (XOF)**.
Langue : **Français**.

---

## 2. Configurer le domaine (DNS)

1. Dans Shopify : **Settings → Domains → Connect existing domain**
2. Saisis `kairos.sn` (ou ton domaine)
3. Shopify te donne deux entrées DNS à configurer chez ton registrar :
   ```
   A     @      23.227.38.65      (IP Shopify)
   CNAME www    shops.myshopify.com
   ```
4. Chez ton registrar (OVH, Gandi, Namecheap, Ionos…) : remplace tes A/CNAME
   actuels par ceux-là.
5. Attends 1-24h (la propagation DNS varie). Shopify teste tout seul.
6. **HTTPS** : Let's Encrypt est activé automatiquement. Rien à faire.

Garde l'ancien hébergement en ligne tant que le DNS n'est pas propagé pour
éviter un trou de service.

---

## 3. Paiement — Afrique de l'Ouest

Shopify Payments natif n'existe pas en Afrique de l'Ouest. Il faut brancher une
**Shopify App** qui agrège les paiements locaux.

### Options recommandées

| App | Méthodes supportées | Frais | Setup |
|---|---|---|---|
| **PayDunya** | Wave, Orange Money, Moov, CB | ~3 % | App store Shopify, compte PayDunya à créer |
| **CinetPay** | Wave, Orange Money, MTN MoMo, CB | ~3 % | Shopify App + compte CinetPay |
| **Flutterwave** | Mobile Money + CB multi-pays | ~3,8 % | Le plus international |

**Recommandation** : **PayDunya** si 90 % de tes clients sont au Sénégal/CI/Mali ;
**Flutterwave** si tu vises 5+ pays.

Ajoute aussi **Paiement à la livraison** comme méthode de paiement manuelle
(Settings → Payments → Manual payment methods → "Cash on delivery").

---

## 4. Exporter les produits depuis la base actuelle

Un script fait le travail :

```bash
./scripts/deploy.sh up              # si les conteneurs ne tournent pas
./scripts/export-shopify.sh         # génère exports/shopify-products.csv
```

Le fichier `exports/shopify-products.csv` est prêt à importer dans Shopify.

**Format** : colonnes standard Shopify (Handle, Title, Body HTML, Vendor, Type,
Tags, Published, Variant Price, Variant Compare At Price, Variant Inventory Qty,
Image Src, Status). Une ligne par produit (une ligne supplémentaire par variante
et par image si présentes).

---

## 5. Importer dans Shopify

1. Shopify admin → **Products → All products**
2. Bouton **Import** en haut à droite
3. Glisse le fichier `exports/shopify-products.csv`
4. ✅ Coche "Overwrite any current products that have the same handle"
5. **Upload and continue**
6. Vérifie l'aperçu → **Import products**

Vérifie après import :
- [ ] Les 5 produits sont là
- [ ] Images bien chargées
- [ ] Prix en FCFA
- [ ] Promo/prix barrés corrects
- [ ] Statut **Active** (pas Draft)
- [ ] Stock renseigné

**Astuce images** : si les URLs `/products/*.png` ne sont pas accessibles depuis
Internet, Shopify ne les importera pas. Il faut soit héberger les PNGs sur un
URL public (GitHub pages, Cloudflare R2, S3, Imgur), soit uploader à la main
depuis l'admin après import (clic sur chaque produit → Images → drag & drop).

---

## 6. Choisir un thème

Trois thèmes gratuits qui collent bien à l'esprit Kairos (éditorial, beauté,
palette chaude) :

1. **Dawn** (officiel Shopify) — le plus proche de ton design actuel : serif,
   espacé, flexible. [Preview](https://themes.shopify.com/themes/dawn)
2. **Sense** — beauté/wellness, couleurs chaudes, très visuel
3. **Refresh** — sobre, blog intégré pour du contenu éditorial

Thèmes payants (200-400 € one-shot) si tu veux pixel-perfect :
- **Impulse**, **Prestige**, **Symmetry** — tous excellents pour du premium.

Applique les couleurs Kairos dans **Online Store → Themes → Customize** :
- Primary : `#6d1e3a` (bordeaux)
- Secondary : `#f5d9d3` (rose poudré)
- Background : `#fbf4ef` (crème)
- Typography : Fraunces + Inter (Google Fonts)

---

## 7. Recréer la structure du site

Shopify l'organise en **Collections** (≈ catégories) et **Pages**.

### Collections à créer

Products → Collections → Create :

| Collection | Type | Règle |
|---|---|---|
| Beauté | Automatic | Type equals `Beauté` |
| Silhouette | Automatic | Type equals `Amincissant` |
| Tonification | Automatic | Type equals `Postérieur` |
| Promos | Automatic | Compare-at-price > price |

### Pages statiques

Online Store → Pages → Add page :
- **Avis clients** (recopier les témoignages)
- **Support / Contact** (WhatsApp, email, FAQ)
- **Livraison & retours**
- **Conditions générales** (CGV)
- **Mentions légales**

### Menu

Online Store → Navigation → Main menu :
- Accueil → /
- Boutique → /collections/all
- Promos → /collections/promos
- Avis → /pages/avis-clients
- Support → /pages/support

---

## 8. Apps utiles (toutes gratuites ou freemium)

| App | Utilité |
|---|---|
| **Shopify Email** | Newsletters, relance panier abandonné |
| **Judge.me** | Avis clients avec photos + modération (gratuit < 100 commandes/mois) |
| **Growave** ou **Smile.io** | Programme de fidélité (points à chaque commande) |
| **Mailchimp** (si déjà utilisé) | Import/sync liste clients |
| **Klaviyo** | Marketing SMS/email avancé (payant mais excellent) |

---

## 9. Paramètres essentiels à vérifier avant lancement

Shopify admin → **Settings** :

- [ ] **General** — nom boutique, adresse, fuseau horaire Africa/Dakar
- [ ] **Locations** — adresse entrepôt (pour calcul livraison)
- [ ] **Shipping and delivery** — zones (Dakar / Banlieue / Régions / International)
   avec les tarifs actuels (1500 / 2500 / 4000 FCFA + reste du monde)
- [ ] **Taxes and duties** — Sénégal TVA 18 %, "included in prices"
- [ ] **Checkout** — customer accounts "Optional", champs adresse "Country + Region"
- [ ] **Notifications** — personnalise les emails de confirmation en français
- [ ] **Policies** — CGV / Politique de retour / Confidentialité (Shopify génère
      des templates que tu adaptes)
- [ ] **Markets** — active les devises EUR et USD pour conversion affichage

---

## 10. Lancement

Ordre conseillé :

1. **Essai** : passe une vraie commande test (paiement réel puis remboursement)
2. **Activer les paiements live** (désactiver le mode test)
3. **Retirer le mot de passe boutique** : Settings → Preferences → décoche
   "Password protect your online store"
4. **Basculer le DNS** vers Shopify (si pas fait)
5. **Annoncer** sur les réseaux + liste email
6. **Arrêter l'ancien site** (docker-compose down) quand la nouvelle boutique
   est OK depuis 48-72h

Garde la base Postgres actuelle (un dump suffit : `./scripts/deploy.sh backup`)
au cas où.

---

## Retour possible

Si tu dois revenir en arrière, tu peux **exporter depuis Shopify** vers le
stack Kairos :
1. Shopify → Products → Export → CSV
2. Script d'import inverse à écrire (non fourni)

Le plus prudent : **garde l'ancien stack offline pendant 1 mois** au cas où.

---

## Coût mensuel estimé

| Poste | Coût |
|---|---|
| Shopify Basic | 29 € |
| App Paiement (PayDunya/CinetPay) | 0 € app + ~3 % du CA |
| Judge.me (avis) | 0 € |
| Domaine kairos.sn | ~15 €/an (1,25 €/mois) |
| Apps optionnelles (Judge.me paid, Klaviyo…) | 0-40 € |
| **Total minimum** | **~30 €/mois + 3 % du CA** |

Comparaison avec le stack actuel : ~10-20 €/mois VPS + temps dev dès qu'il y a
un souci.

---

## Checklist rapide

```
[ ] Compte Shopify créé (essai 14 jours)
[ ] Plan choisi et payé (Basic)
[ ] DNS kairos.sn configuré
[ ] CSV produits exporté (scripts/export-shopify.sh)
[ ] Produits importés + images vérifiées
[ ] Thème choisi et customisé aux couleurs Kairos
[ ] Collections (Beauté/Silhouette/Tonification/Promos) créées
[ ] Pages (Avis, Support, CGV, Mentions) rédigées
[ ] Menu principal configuré
[ ] App paiement installée et testée (PayDunya ou CinetPay)
[ ] Zones de livraison + tarifs renseignés
[ ] Taxes configurées (TVA Sénégal)
[ ] Emails de confirmation traduits en français
[ ] Commande test réussie
[ ] Password boutique retiré
[ ] DNS basculé
[ ] Ancien site arrêté (+1 mois de sécurité)
```
