# Guide d'Installation - Koalactivit

Ce guide vous aidera Ã  configurer un environnement complÃ¨tement isolÃ© et autonome pour Koalactivit.

## Architecture d'Isolation

L'application est conÃ§ue pour Ãªtre totalement autonome avec :
- **Docker** : Conteneurisation complÃ¨te de l'environnement
- **Environnement virtuel Python** : Isolation des dÃ©pendances Python
- **Node modules locaux** : DÃ©pendances JavaScript isolÃ©es
- **ChromeDriver intÃ©grÃ©** : Pour Selenium sans dÃ©pendance externe

## MÃ©thodes d'Installation

### MÃ©thode 1: Installation Docker (RecommandÃ©e - Isolation ComplÃ¨te)

Docker fournit une isolation complÃ¨te du systÃ¨me hÃ´te.

#### PrÃ©requis
- Docker Desktop installÃ© ([tÃ©lÃ©charger](https://www.docker.com/products/docker-desktop))
- Docker Compose (inclus avec Docker Desktop)

#### Installation
```bash
# Cloner le repo
git clone [URL_DU_REPO]
cd Koalactivit-

# Construire et lancer avec Docker Compose
docker-compose -f docker/docker-compose.yml up --build
```

L'application sera accessible sur `http://localhost:3000`

#### Commandes Docker Utiles
```bash
# Lancer en arriÃ¨re-plan
docker-compose -f docker/docker-compose.yml up -d

# ArrÃªter
docker-compose -f docker/docker-compose.yml down

# Voir les logs
docker-compose -f docker/docker-compose.yml logs -f

# Reconstruire aprÃ¨s modifications
docker-compose -f docker/docker-compose.yml build --no-cache
```

### MÃ©thode 2: Installation Locale avec Scripts Automatiques

Cette mÃ©thode configure un environnement isolÃ© sur votre machine.

#### PrÃ©requis
- Python 3.11+ ([tÃ©lÃ©charger](https://www.python.org/downloads/))
- Node.js 20+ ([tÃ©lÃ©charger](https://nodejs.org/))
- Git ([tÃ©lÃ©charger](https://git-scm.com/))

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

# Rendre les scripts exÃ©cutables
chmod +x scripts/setup.sh scripts/start.sh
# Lancer le script de setup
./setup.sh
```

### MÃ©thode 3: Installation Manuelle

Si les scripts automatiques ne fonctionnent pas :

1. **CrÃ©er l'environnement virtuel Python**
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate
```

2. **Installer les dÃ©pendances Python**
```bash
pip install -r requirements.txt
```

3. **Installer les dÃ©pendances Node.js**
```bash
npm install
```

4. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Ã‰diter .env avec vos configurations
```

5. **CrÃ©er les rÃ©pertoires nÃ©cessaires**
```bash
mkdir data logs downloads cache
```

## Configuration

### Fichier .env

CrÃ©ez un fichier `.env` Ã  la racine du projet :

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
- Chrome sera tÃ©lÃ©chargÃ© automatiquement via webdriver-manager

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

## DÃ©marrage de l'Application

### Avec Docker
```bash
docker-compose -f docker/docker-compose.yml up
```

### Sans Docker

#### Windows
```batch
scripts\\start.bat
```

#### Linux/macOS
```bash
./scripts/start.sh
```

#### Commande directe
```bash
# Activer l'environnement virtuel d'abord
npm run dev
```

## Structure des DÃ©pendances

### DÃ©pendances Python (requirements.txt)
- `selenium` : Automatisation web
- `pandas` : Traitement de donnÃ©es
- `openpyxl` : Lecture/Ã©criture Excel
- `requests` : RequÃªtes HTTP
- `python-dotenv` : Gestion variables d'environnement

### DÃ©pendances Node.js (package.json)
- `express` : Serveur web
- `@octokit/rest` : API GitHub
- `dotenv` : Variables d'environnement
- `node-fetch` : RequÃªtes HTTP

## VÃ©rification de l'Installation

1. **VÃ©rifier l'environnement Python**
```bash
# Windows
.venv\Scripts\python --version

# Linux/macOS
.venv/bin/python --version
```

2. **VÃ©rifier les dÃ©pendances**
```bash
pip list
npm list
```

3. **Tester le serveur**
```bash
npm run dev
# Ouvrir http://localhost:3000
```

## DÃ©pannage

### ProblÃ¨me : "Python/Node.js n'est pas reconnu"
- Assurez-vous que Python et Node.js sont dans le PATH systÃ¨me
- RedÃ©marrez votre terminal aprÃ¨s installation

### ProblÃ¨me : "Permission denied" sur Linux/macOS
```bash
chmod +x scripts/setup.sh scripts/start.sh
```

### ProblÃ¨me : ChromeDriver ne fonctionne pas
- VÃ©rifiez que Chrome/Chromium est installÃ©
- Sur Windows, webdriver-manager tÃ©lÃ©chargera automatiquement le driver
- Sur Linux/macOS, installez via le gestionnaire de paquets

### ProblÃ¨me : Port 3000 dÃ©jÃ  utilisÃ©
Modifiez le port dans `.env` :
```env
PORT=3001
```

## Mise Ã  Jour

### Avec Docker
```bash
docker-compose -f docker/docker-compose.yml down
git pull
docker-compose -f docker/docker-compose.yml build --no-cache
docker-compose -f docker/docker-compose.yml up
```

### Sans Docker
```bash
git pull
pip install -r requirements.txt
npm install
```

## DÃ©sinstallation

### Docker
```bash
docker-compose -f docker/docker-compose.yml down
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

Pour toute question ou problÃ¨me, consultez :
- Les logs dans le dossier `logs/`
- La documentation dans `README.md`
- Les issues sur le repo GitHub
