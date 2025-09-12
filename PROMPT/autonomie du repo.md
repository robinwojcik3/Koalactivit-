Objectif: rendre le dépôt 100% autonome et isolé (zéro dépendance externe).

Exigences générales

Autonomie totale: aucun logiciel, extension, service, variable d’environnement ou configuration système externe requis pour exécuter, développer ou builder l’application.
Isolation: tout ce dont dépend l’app est contenu dans le dépôt (binaires portables, scripts, runtimes, assets, modèles, données d’exemple, outils de build).
Portabilité: fonctionnement “out of the box” après clonage, sur Windows et macOS/Linux, en mode hors‑ligne.
Livrables attendus

Scripts de démarrage autonomes: start.bat (Windows) et start.sh (Unix) qui lancent l’app sans installation préalable.
Runtimes embarqués: inclure/vendoriser Node et Python portables, plus tout binaire/driver requis; tous les scripts pointent vers ces runtimes locaux.
Dépendances vendorisées: paquets critiques (JS/Python) et binaires tiers essentiels présents dans le repo ou packagés dans vendor/ (aucun npm/pip install requis).
Serveur local prêt: local-server.js ou équivalent fonctionnant sans secrets exposés côté client; utiliser des tokens/fixtures locaux pour la démo.
Données et assets: inclure un hotspots.geojson d’exemple, tuiles/MBTiles ou équivalent, polices et bibliothèques front en local (pas de CDN).
Documentation: README.md mis à jour détaillant architecture, lancement offline, et structure des répertoires.
Travaux à réaliser

Audit des dépendances: recenser logiciels, versions, paquets, binaires, services externes (APIs, CDNs, polices, tuiles, etc.).
Élimination des externes: remplacer toute ressource distante par une alternative locale (polices, libs JS/CSS, tuiles/cartes, scripts).
Vendorisation des runtimes: intégrer Node/Python portables dans vendor/ et adapter les scripts pour forcer leur usage (PATH local).
Mode hors‑ligne: retirer tout appel réseau à l’exécution; fournir fixtures locales pour toutes fonctionnalités clés.
Scripts unifiés: normaliser npm run dev, python, etc., pour utiliser les runtimes locaux; alias dans package.json et .bat/.sh.
Secrets: supprimer la nécessité de secrets distants; si indispensable, utiliser des tokens factices pour la démo locale.
Nettoyage: supprimer fichiers/dirs non utilisés, dépendances non référencées, exemples obsolètes; aligner avec les objectifs du README.md.
Validation: tester lancement sur Windows et macOS/Linux sans réseau après un clone frais.
Critères d’acceptation

Lancement offline via start.bat et ./start.sh sans installation préalable.
Aucune requête réseau pendant l’usage de base (analyse, carte, création/sauvegarde d’itinéraires en local).
Aucun outil global requis (npm install, pip install, Node/Python système interdits).
Documentation à jour, cohérente et testée.
Notes d’implémentation

Répertoires suggérés: vendor/ (runtimes/binaries), site/vendor/ (assets tiers: Leaflet, polices, icônes), data/ (jeux d’exemple).
Toute référence CDN doit devenir un chemin local; inclure les fichiers nécessaires dans le repo.
Résultat attendu

Un dépôt auto‑suffisant, reproductible, exécutable hors‑ligne, aligné sur les objectifs décrits dans README.md.