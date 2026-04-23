# Kairos Distributions

E-commerce beauté et minceur : monorepo Next.js + NestJS + Prisma + PostgreSQL.

## Architecture

```
├── frontend/         Next.js 14 (App Router)
│   ├── app/
│   │   ├── (client)/ pages publiques
│   │   └── admin/    dashboard admin
├── backend/          NestJS + Prisma
│   ├── src/
│   │   ├── auth/     JWT + bcrypt
│   │   ├── products/ CRUD produits
│   │   ├── orders/   commandes
│   │   ├── reviews/  avis clients
│   └── prisma/       schema Prisma
├── docker-compose.yml
└── legacy/           ancien prototype HTML/JS
```

## Démarrage rapide (Docker)

```bash
docker-compose up --build
```

Accès :
- Boutique : http://localhost:3000
- Admin custom : http://localhost:3000/admin
- **Directus CMS** : http://localhost:8055 — interface conviviale pour les non-techniciens
- Backend (API) : http://localhost:4000
- PostgreSQL : localhost:5432 (kairos / kairos)

Identifiants par défaut (custom admin et Directus) :
`admin@kairos.sn` / `kairos2026`

## Pourquoi deux interfaces d'admin ?

- **`/admin`** (Next.js) : back-office sur-mesure, accordé au design Kairos.
- **Directus** (`:8055`) : CMS open-source qui se connecte directement à la base
  Postgres existante. Idéal pour un opérateur non-technique : gestion produits,
  upload d'images, modération des avis, suivi commandes en quelques clics.

À la première connexion à Directus, va dans **Settings → Data Model** et
clique sur "Create Collection from Existing Table" pour exposer Product,
Order, Review, etc.

## Installation manuelle

### Prérequis
- Node.js ≥ 20
- PostgreSQL ≥ 14
- npm ou pnpm

### Backend
```bash
cd backend
npm install
cp .env.example .env
# éditer DATABASE_URL et JWT_SECRET
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Scripts disponibles

### Backend
- `npm run start:dev` — mode développement (hot reload)
- `npm run build` — compile TypeScript
- `npm run start` — lance la version buildée
- `npx prisma migrate dev` — applique les migrations
- `npx prisma studio` — explorateur de la base
- `npm run seed` — seed initial (admin + produits démo)

### Frontend
- `npm run dev` — dev Next.js sur :3000
- `npm run build` — build production
- `npm start` — sert le build
- `npm run lint`

## Variables d'environnement

### Backend (`backend/.env`)
```
DATABASE_URL="postgresql://kairos:kairos@localhost:5432/kairos?schema=public"
JWT_SECRET="change-me"
JWT_EXPIRES_IN="4h"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API Backend

Base URL : `http://localhost:4000`

| Méthode | Endpoint              | Auth  | Description             |
|---------|----------------------|-------|-------------------------|
| POST    | `/auth/login`        | —     | Login admin             |
| POST    | `/auth/register`     | —     | Création compte         |
| GET     | `/products`          | —     | Liste produits          |
| GET     | `/products/:slug`    | —     | Détail produit          |
| POST    | `/products`          | admin | Créer produit           |
| PATCH   | `/products/:id`      | admin | Modifier produit        |
| DELETE  | `/products/:id`      | admin | Supprimer produit       |
| POST    | `/orders`            | —     | Créer commande          |
| GET     | `/orders`            | admin | Toutes les commandes    |
| GET     | `/orders/:id`        | —     | Détail commande         |
| PATCH   | `/orders/:id/status` | admin | MAJ statut              |
| POST    | `/reviews`           | —     | Soumettre un avis       |
| GET     | `/reviews`           | —     | Avis approuvés          |
| PATCH   | `/reviews/:id`       | admin | Modérer un avis         |

## Déploiement

- Frontend : Vercel ou container Docker
- Backend : Railway, Render, Fly.io ou VPS avec Postgres managé
- HTTPS : activer TLS via reverse proxy (Nginx/Caddy) ou provider

## Anciens fichiers

Le prototype HTML/JS d'origine est conservé dans `legacy/` (ouvrir `legacy/index.html` directement dans un navigateur).
