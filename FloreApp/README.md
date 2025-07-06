# FloreApp

FloreApp est une application destinée à identifier des lieux favorables aux activités de Koala et à enregistrer des itinéraires personnalisés. Ce dépôt contient une ébauche de scripts et la documentation nécessaire pour démarrer le projet.

## Fonctionnalités prévues

1. **Analyse floristique**
   - Interrogation de l'API GBIF pour récupérer les occurrences de certaines espèces végétales.
   - Analyse spatiale pour détecter les "hotspots" de biodiversité.
   - Suggestion automatique de dix lieux propices selon la richesse floristique.

2. **Tracé d'itinéraires**
   - Carte interactive permettant de dessiner manuellement un parcours.
   - Sauvegarde des itinéraires au format GeoJSON (ou CSV) dans un dépôt distant via l'API GitHub.

## Installation

1. Créer et activer un environnement virtuel Python.
2. Installer les dépendances :

```bash
pip install -r requirements.txt
```

## Structure du dépôt

- `gbif_hotspots.py` : récupère les données GBIF et calcule les zones de forte concentration d'espèces.
- `interactive_map.py` : prototype de carte interactive pour tracer et sauvegarder des itinéraires.
- `requirements.txt` : liste des dépendances Python.

## Remarques

L'accès à l'API GBIF peut être restreint depuis l'environnement d'exécution de Codex. Les appels à l'API sont inclus à titre d'exemple, mais peuvent nécessiter une configuration réseau spécifique pour fonctionner correctement.
