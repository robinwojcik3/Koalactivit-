# Koala ActivitÃ©s

Application autonome pour identifier des lieux favorables aux activitÃ©s de Koala (FloreApp) et enregistrer des itinÃ©raires personnalisÃ©s.

## ðŸš€ CaractÃ©ristiques clÃ©s

- **100% autonome** : Toutes les dÃ©pendances sont incluses dans le dÃ©pÃ´t
- **Sans installation** : Aucune dÃ©pendance systÃ¨me requise
- **Portable** : Fonctionne immÃ©diatement aprÃ¨s clonage
- **Hors-ligne** : Ne dÃ©pend d'aucun service externe

## Ã‰tapes clÃ©s du projet

### Partie 1Â : Analyse et Identification des Lieux

1. **Collecte des donnÃ©es**Â : dÃ©finir les espÃ¨ces vÃ©gÃ©tales cibles et interroger l'API du GBIF pour collecter toutes les occurrences gÃ©orÃ©fÃ©rencÃ©es.
2. **PrÃ©paration des donnÃ©es**Â : nettoyer les donnÃ©es brutes en supprimant les doublons et les points aberrants, puis les agrÃ©ger en un seul jeu de donnÃ©es gÃ©ospatialisÃ©es.
3. **Analyse de densitÃ©**Â : appliquer une estimation par noyau (KDE) sur l'ensemble des points pour gÃ©nÃ©rer une carte de chaleur reprÃ©sentant la densitÃ© des espÃ¨ces sur le territoire.
4. **Extraction des hotspots**Â : isoler les cellules dÃ©passant un seuil de haute densitÃ© (ex. 95áµ‰ percentile) et les convertir en polygones pour dÃ©limiter les hotspots.
5. **Classement et sÃ©lection**Â : attribuer un score Ã  chaque polygone de hotspot (densitÃ© moyenne, nombre de points, etc.) et sÃ©lectionner les dix meilleurs.

Un script Python (`FloreApp/gbif_hotspots.py`) automatise ces Ã©tapes et produit un fichier `hotspots.geojson`.

### Partie 2Â : CrÃ©ation et Sauvegarde des ItinÃ©raires

6. **Interface cartographique**Â : mettre en place une carte interactive (Leaflet.js ou Ã©quivalent) permettant Ã  l'utilisateur de dessiner une ligne.
7. **Formatage des donnÃ©es**Â : une fois le tracÃ© terminÃ©, capturer les coordonnÃ©es de l'itinÃ©raire et les structurer en GeoJSON.
8. **Mise en place du backend**Â : dÃ©velopper un service qui reÃ§oit le GeoJSON et gÃ¨re l'authentification avec l'API GitHub pour ne pas exposer de clÃ© secrÃ¨te.
9. **PrÃ©paration de la sauvegarde**Â : encoder le fichier GeoJSON en Base64 et prÃ©parer la requÃªte pour l'API GitHub avec un message de commit.
10. **Commit via API**Â : envoyer la requÃªte PUT finale pour crÃ©er ou mettre Ã  jour le fichier de l'itinÃ©raire dans le dÃ©pÃ´t distant.

## ðŸš€ DÃ©marrage rapide

1. **Cloner le dÃ©pÃ´t**
   ```bash
   git clone [URL_DU_REPO]
   cd Koalactivit-
   ```

2. **Lancer l'application**
   ```bash
   # Sur Windows
   .\scripts\start.bat
   
   # Sur macOS/Linux
   chmod +x scripts/start.sh
   ./scripts/start.sh
   ```

3. **Ouvrir dans le navigateur**
   - Allez sur http://localhost:8888

## ðŸ“‚ Structure du projet

```
.
â”œâ”€â”€ Data scraping/            # Scripts de web scraping biodiversitÃ©
â”œâ”€â”€ FloreApp/                 # Scripts Python d'analyse
â”œâ”€â”€ site/                     # Interface utilisateur web
â”œâ”€â”€ netlify/                  # Fonctions Netlify
â”œâ”€â”€ docker/                   # Dockerfile et docker-compose.yml
â”œâ”€â”€ scripts/                  # Scripts (start, setup, docker-*)
â”œâ”€â”€ docs/                     # Documentation, guides et prompts
â”œâ”€â”€ data/                     # DonnÃ©es locales (ex: lavaldens.txt)
â”œâ”€â”€ local-server.js           # Serveur de dÃ©veloppement intÃ©grÃ©
â”œâ”€â”€ package.json              # DÃ©pendances Node.js
â”œâ”€â”€ package-lock.json         # Lockfile npm
â”œâ”€â”€ requirements.txt          # DÃ©pendances Python
â”œâ”€â”€ netlify.toml              # Configuration Netlify
â””â”€â”€ README.md                 # Ce fichier
```

## ðŸ”§ DÃ©veloppement

### PrÃ©requis

- Aucune installation requise (tout est inclus)
- Pour le dÃ©veloppement : Node.js et Python (uniquement pour modifier le code source)

### Commandes utiles

```bash
# DÃ©marrer le serveur de dÃ©veloppement
npm run dev

# GÃ©nÃ©rer les hotspots (nÃ©cessite Python)
python FloreApp/gbif_hotspots.py

# Installer les dÃ©pendances (si modification du code)
npm install
```

## ðŸŒ¿ Scraping des donnÃ©es Biodiv'AURA

Le script `Data scraping/Biodiv'AURA scraping script.py` permet de tÃ©lÃ©charger automatiquement les donnÃ©es d'occurrence d'espÃ¨ces depuis le portail Biodiv'AURA.

### PrÃ©requis

- Python 3.7+
- Navigateur Chrome installÃ©
- Compte Biodiv'AURA (les identifiants sont nÃ©cessaires dans le script)

### Installation des dÃ©pendances

```bash
pip install pandas selenium webdriver-manager openpyxl
```

### Utilisation

1. Mettez Ã  jour les variables suivantes dans le script :
   - `AURA_USERNAME` : Votre nom d'utilisateur Biodiv'AURA
   - `AURA_PASSWORD` : Votre mot de passe Biodiv'AURA
   - `EXCEL_PATH` : Chemin vers votre fichier Excel contenant la liste des taxons
   - `DOWNLOAD_DIR` : Dossier de destination pour les fichiers tÃ©lÃ©chargÃ©s
   - `DEPARTEMENT_TEXTE` : Le dÃ©partement cible (ex: "Isere")

2. ExÃ©cutez le script :
   ```bash
   python "Data scraping/Biodiv'AURA scraping script.py"
   ```

Le script va automatiquement :
- Se connecter Ã  Biodiv'AURA
- Parcourir la liste des taxons
- Effectuer une recherche pour chaque taxon dans le dÃ©partement spÃ©cifiÃ©
- TÃ©lÃ©charger les donnÃ©es au format shapefile

## ðŸ“ Directives de dÃ©veloppement

Consultez [docs/agent.md](docs/agent.md) pour les directives complÃ¨tes sur le dÃ©veloppement autonome.


Voir aussi la configuration des commandes Claude Code: [docs/claude-commands.md](docs/claude-commands.md)
