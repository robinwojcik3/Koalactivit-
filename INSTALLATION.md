# Guide d'Installation - Koalactivit

Ce guide vous aidera à configurer un environnement complètement isolé et autonome pour Koalactivit.

## Architecture d'Isolation

L'application est conçue pour être totalement autonome avec :
- **Docker** : Conteneurisation complète de l'environnement
- **Environnement virtuel Python** : Isolation des dépendances Python
- **Node modules locaux** : Dépendances JavaScript isolées
- **ChromeDriver intégré** : Pour Selenium sans dépendance externe

## Méthodes d'Installation

### Méthode 1: Installation Docker (Recommandée - Isolation Complète)

Docker fournit une isolation complète du système hôte.

#### Prérequis
- Docker Desktop installé ([télécharger](https://www.docker.com/products/docker-desktop))
- Docker Compose (inclus avec Docker Desktop)

#### Installation
```bash
# Cloner le repo
git clone [URL_DU_REPO]
cd Koalactivit-

# Construire et lancer avec Docker Compose
docker-compose up --build
```

L'application sera accessible sur `http://localhost:3000`

#### Commandes Docker Utiles
```bash
# Lancer en arrière-plan
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Reconstruire après modifications
docker-compose build --no-cache
```

### Méthode 2: Installation Locale avec Scripts Automatiques

Cette méthode configure un environnement isolé sur votre machine.

#### Prérequis
- Python 3.11+ ([télécharger](https://www.python.org/downloads/))
- Node.js 20+ ([télécharger](https://nodejs.org/))
- Git ([télécharger](https://git-scm.com/))

#### Installation sur Windows
```batch
# Cloner le repo
git clone [URL_DU_REPO]
cd Koalactivit-

# Lancer le script de setup
setup.bat
```

#### Installation sur Linux/macOS
```bash
# Cloner le repo
git clone [URL_DU_REPO]
cd Koalactivit-

# Rendre les scripts exécutables
chmod +x setup.sh start.sh

# Lancer le script de setup
./setup.sh
```

### Méthode 3: Installation Manuelle

Si les scripts automatiques ne fonctionnent pas :

1. **Créer l'environnement virtuel Python**
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate
```

2. **Installer les dépendances Python**
```bash
pip install -r requirements.txt
```

3. **Installer les dépendances Node.js**
```bash
npm install
```

4. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos configurations
```

5. **Créer les répertoires nécessaires**
```bash
mkdir data logs downloads cache
```

## Configuration

### Fichier .env

Créez un fichier `.env` à la racine du projet :

```env
# Configuration de base
NODE_ENV=development
PORT=3000

# API Keys (optionnelles selon usage)
GITHUB_TOKEN=your_token_here
GBIF_USERNAME=your_username
GBIF_PASSWORD=your_password
GBIF_EMAIL=your_email

# Selenium (configuration automatique)
CHROME_BIN=/usr/bin/chromium
CHROMEDRIVER_PATH=/usr/bin/chromedriver
```

### Configuration Chrome/Chromium

#### Windows
- Chrome sera téléchargé automatiquement via webdriver-manager

#### Linux
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser chromium-chromedriver
```

#### macOS
```bash
brew install --cask chromium
brew install chromedriver
```

## Démarrage de l'Application

### Avec Docker
```bash
docker-compose up
```

### Sans Docker

#### Windows
```batch
start.bat
```

#### Linux/macOS
```bash
./start.sh
```

#### Commande directe
```bash
# Activer l'environnement virtuel d'abord
npm run dev
```

## Structure des Dépendances

### Dépendances Python (requirements.txt)
- `selenium` : Automatisation web
- `pandas` : Traitement de données
- `openpyxl` : Lecture/écriture Excel
- `requests` : Requêtes HTTP
- `python-dotenv` : Gestion variables d'environnement

### Dépendances Node.js (package.json)
- `express` : Serveur web
- `@octokit/rest` : API GitHub
- `dotenv` : Variables d'environnement
- `node-fetch` : Requêtes HTTP

## Vérification de l'Installation

1. **Vérifier l'environnement Python**
```bash
# Windows
.venv\Scripts\python --version

# Linux/macOS
.venv/bin/python --version
```

2. **Vérifier les dépendances**
```bash
pip list
npm list
```

3. **Tester le serveur**
```bash
npm run dev
# Ouvrir http://localhost:3000
```

## Dépannage

### Problème : "Python/Node.js n'est pas reconnu"
- Assurez-vous que Python et Node.js sont dans le PATH système
- Redémarrez votre terminal après installation

### Problème : "Permission denied" sur Linux/macOS
```bash
chmod +x setup.sh start.sh
```

### Problème : ChromeDriver ne fonctionne pas
- Vérifiez que Chrome/Chromium est installé
- Sur Windows, webdriver-manager téléchargera automatiquement le driver
- Sur Linux/macOS, installez via le gestionnaire de paquets

### Problème : Port 3000 déjà utilisé
Modifiez le port dans `.env` :
```env
PORT=3001
```

## Mise à Jour

### Avec Docker
```bash
docker-compose down
git pull
docker-compose build --no-cache
docker-compose up
```

### Sans Docker
```bash
git pull
pip install -r requirements.txt
npm install
```

## Désinstallation

### Docker
```bash
docker-compose down
docker rmi koalactivit-app
```

### Installation locale
```bash
# Windows
rmdir /s .venv node_modules

# Linux/macOS
rm -rf .venv node_modules
```

## Support

Pour toute question ou problème, consultez :
- Les logs dans le dossier `logs/`
- La documentation dans `README.md`
- Les issues sur le repo GitHub