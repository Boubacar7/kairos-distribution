# Scripts de déploiement

Scripts utilitaires pour lancer l'application Kairos.

| Script | Description |
|--------|-------------|
| `deploy.sh` | Déploiement complet via Docker Compose (prod-like). |
| `dev.sh` | Lance le stack en mode développement (hot reload natif). |
| `prod.sh` | Build production + lancement sans Docker. |

## Usage rapide

```bash
# Lancer toute l'appli (Docker)
./scripts/deploy.sh up

# Voir les logs
./scripts/deploy.sh logs

# Arrêter (en conservant les données)
./scripts/deploy.sh down

# Réinitialiser complètement (⚠ supprime les données)
./scripts/deploy.sh reset

# Re-seeder la base
./scripts/deploy.sh seed

# Mode développement local (hors Docker)
./scripts/dev.sh
```

## Accès par défaut

- Boutique : http://localhost:3000
- Admin : http://localhost:3000/admin — `admin@kairos.sn` / `kairos2026`
- Directus CMS : http://localhost:8055 — mêmes identifiants
- API : http://localhost:4000/api
- PostgreSQL : `postgres://kairos:kairos@localhost:5432/kairos`

## Prérequis

- `deploy.sh` → Docker + Docker Compose
- `dev.sh` → Node.js ≥20, npm, Docker (pour la base seulement)
- `prod.sh` → Node.js ≥20, PostgreSQL accessible, variables d'environnement définies
