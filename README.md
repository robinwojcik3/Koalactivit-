Voici une décomposition du projet en 10 étapes clés.

Partie 1 : Analyse et Identification des Lieux
Collecte des Données : Définir les espèces végétales cibles et interroger l'API du GBIF pour collecter toutes les occurrences géoréférencées.

Préparation des Données : Nettoyer les données brutes en supprimant les doublons et les points aberrants, puis les agréger en un seul jeu de données géospatiales.

Analyse de Densité : Appliquer une méthode d'estimation par noyau (KDE) sur l'ensemble des points pour générer un raster (carte de chaleur) représentant la densité des espèces sur le territoire.

Extraction des Hotspots : Isoler les cellules du raster dépassant un seuil de haute densité (ex: 95ème percentile) et les convertir en polygones vectoriels pour délimiter les hotspots.

Classement et Sélection : Attribuer un score à chaque polygone de hotspot (basé sur la densité moyenne, le nombre de points, etc.) et sélectionner les 10 polygones ayant les meilleurs scores.

Partie 2 : Création et Sauvegarde des Itinéraires
Interface Cartographique : Mettre en place une carte interactive (avec Leaflet.js ou équivalent) dotée d'outils permettant à l'utilisateur de dessiner manuellement une ligne (itinéraire).

Formatage des Données : Une fois le tracé terminé, capturer les coordonnées de l'itinéraire et les structurer dans un format standardisé, idéalement en GeoJSON.

Mise en Place du Backend : Développer un service backend (serveur) qui agira comme intermédiaire sécurisé. Son rôle est de recevoir le GeoJSON du client et de gérer l'authentification avec l'API de GitHub pour ne pas exposer de clés secrètes.

Préparation de la Sauvegarde : Sur le backend, encoder le contenu du fichier GeoJSON en Base64 et préparer la requête pour l'API GitHub, en incluant un message de commit.

Commit via API : Envoyer la requête PUT finale à l'API GitHub pour créer ou mettre à jour le fichier de l'itinéraire dans le dépôt, finalisant ainsi la sauvegarde.
