# Koala Activités

Application autonome pour identifier des lieux favorables aux activités de Koala (FloreApp) et enregistrer des itinéraires personnalisés.

## 🚀 Caractéristiques clés

- **100% autonome** : Toutes les dépendances sont incluses dans le dépôt
- **Sans installation** : Aucune dépendance système requise
- **Portable** : Fonctionne immédiatement après clonage
- **Hors-ligne** : Ne dépend d'aucun service externe

## Étapes clés du projet

### Partie 1 : Analyse et Identification des Lieux

1. **Collecte des données** : définir les espèces végétales cibles et interroger l'API du GBIF pour collecter toutes les occurrences géoréférencées.
2. **Préparation des données** : nettoyer les données brutes en supprimant les doublons et les points aberrants, puis les agréger en un seul jeu de données géospatialisées.
3. **Analyse de densité** : appliquer une estimation par noyau (KDE) sur l'ensemble des points pour générer une carte de chaleur représentant la densité des espèces sur le territoire.
4. **Extraction des hotspots** : isoler les cellules dépassant un seuil de haute densité (ex. 95ᵉ percentile) et les convertir en polygones pour délimiter les hotspots.
5. **Classement et sélection** : attribuer un score à chaque polygone de hotspot (densité moyenne, nombre de points, etc.) et sélectionner les dix meilleurs.

Un script Python (`FloreApp/gbif_hotspots.py`) automatise ces étapes et produit un fichier `hotspots.geojson`.

### Partie 2 : Création et Sauvegarde des Itinéraires

6. **Interface cartographique** : mettre en place une carte interactive (Leaflet.js ou équivalent) permettant à l'utilisateur de dessiner une ligne.
7. **Formatage des données** : une fois le tracé terminé, capturer les coordonnées de l'itinéraire et les structurer en GeoJSON.
8. **Mise en place du backend** : développer un service qui reçoit le GeoJSON et gère l'authentification avec l'API GitHub pour ne pas exposer de clé secrète.
9. **Préparation de la sauvegarde** : encoder le fichier GeoJSON en Base64 et préparer la requête pour l'API GitHub avec un message de commit.
10. **Commit via API** : envoyer la requête PUT finale pour créer ou mettre à jour le fichier de l'itinéraire dans le dépôt distant.

## 🚀 Démarrage rapide

1. **Cloner le dépôt**
   ```bash
   git clone [URL_DU_REPO]
   cd Koalactivit-
   ```

2. **Lancer l'application**
   ```bash
   # Sur Windows
   .\start.bat
   
   # Sur macOS/Linux
   chmod +x start.sh
   ./start.sh
   ```

3. **Ouvrir dans le navigateur**
   - Allez sur http://localhost:8888

## 📂 Structure du projet

```
.
├── FloreApp/           # Scripts Python pour l'analyse des données
├── node_modules/       # Dépendances Node.js (créé automatiquement)
├── site/               # Interface utilisateur web
├── .env.example        # Exemple de configuration
├── agent.md            # Directives de développement
├── local-server.js     # Serveur de développement intégré
├── package.json        # Configuration Node.js
└── README.md           # Ce fichier
```

## 🔧 Développement

### Prérequis

- Aucune installation requise (tout est inclus)
- Pour le développement : Node.js et Python (uniquement pour modifier le code source)

### Commandes utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Générer les hotspots (nécessite Python)
python FloreApp/gbif_hotspots.py

# Installer les dépendances (si modification du code)
npm install
```

## 📝 Directives de développement

Consultez [agent.md](agent.md) pour les directives complètes sur le développement autonome.
