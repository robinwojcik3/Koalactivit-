# 🐳 Guide Rapide Docker - Koalactivit

## Démarrage Rapide

### 1️⃣ Prérequis
- **Docker Desktop** doit être installé
  - [Télécharger Docker Desktop pour Windows](https://www.docker.com/products/docker-desktop)
  - Après installation, redémarrez votre ordinateur

### 2️⃣ Lancer l'Application

**Option A - Script Automatique (Recommandé)**
```batch
docker-start.bat
```
Ce script :
- ✅ Démarre Docker Desktop si nécessaire
- ✅ Construit l'image Docker
- ✅ Lance l'application

**Option B - Commandes Manuelles**
```bash
# Construire l'image
docker-compose build

# Lancer l'application
docker-compose up
```

### 3️⃣ Accéder à l'Application
Ouvrez votre navigateur : **http://localhost:3000**

### 4️⃣ Arrêter l'Application
```batch
docker-stop.bat
```
ou `Ctrl+C` dans le terminal puis :
```bash
docker-compose down
```

## Commandes Utiles

### Lancer en arrière-plan
```bash
docker-compose up -d
```

### Voir les logs
```bash
docker-compose logs -f
```

### Reconstruire après modifications
```bash
docker-compose build --no-cache
docker-compose up
```

### Nettoyer complètement
```bash
docker-compose down
docker system prune -a
```

## Structure Docker

```
Koalactivit/
├── Dockerfile          # Image Docker
├── docker-compose.yml  # Configuration des services
├── .dockerignore      # Fichiers à exclure
├── docker-start.bat   # Script de démarrage
└── docker-stop.bat    # Script d'arrêt
```

## Résolution de Problèmes

### ❌ "Docker Desktop n'est pas démarré"
→ Lancez Docker Desktop manuellement ou utilisez `docker-start.bat`

### ❌ "Port 3000 déjà utilisé"
→ Modifiez le port dans `docker-compose.yml` :
```yaml
ports:
  - "3001:3000"  # Utilise le port 3001
```

### ❌ "Permission denied"
→ Lancez Docker Desktop en tant qu'administrateur

### ❌ Construction échoue
→ Vérifiez votre connexion internet (téléchargement des images de base)

## Avantages de Docker

✅ **Isolation complète** - Aucune interférence avec votre système
✅ **Reproductibilité** - Même environnement partout
✅ **Facilité** - Une commande pour tout installer
✅ **Nettoyage facile** - Suppression complète sans traces

## Mémento

| Action | Commande |
|--------|----------|
| 🚀 Démarrer | `docker-start.bat` |
| 🛑 Arrêter | `docker-stop.bat` |
| 📊 Voir les logs | `docker-compose logs -f` |
| 🔄 Reconstruire | `docker-compose build --no-cache` |
| 🗑️ Nettoyer | `docker-compose down` |