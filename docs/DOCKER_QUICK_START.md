# 🚀 Guide Rapide Docker - Koalactivit

## Démarrage Rapide

### 1) Prérequis
- Docker Desktop installé et démarré

### 2) Lancer l'application

Option A — Script (recommandé)

```bat
scripts\docker-start.bat
```

Option B — Commandes manuelles

```bash
# Construire l'image
docker-compose -f docker/docker-compose.yml build

# Lancer l'application
docker-compose -f docker/docker-compose.yml up
```

### 3) Accès
Ouvrir le navigateur sur: http://localhost:3000

### 4) Arrêt

```bat
scripts\docker-stop.bat
```

ou

```bash
docker-compose -f docker/docker-compose.yml down
```

## Commandes utiles

- Logs: `docker-compose -f docker/docker-compose.yml logs -f`
- Détaché: `docker-compose -f docker/docker-compose.yml up -d`
- Reconstruire: `docker-compose -f docker/docker-compose.yml build --no-cache`
- Nettoyer: `docker-compose -f docker/docker-compose.yml down`

## Structure Docker

```
Koalactivit/
├── docker/
│   ├── Dockerfile            # Image Docker
│   └── docker-compose.yml    # Services / volumes
└── scripts/
    ├── docker-start.bat      # Démarrage Docker
    └── docker-stop.bat       # Arrêt Docker
```

