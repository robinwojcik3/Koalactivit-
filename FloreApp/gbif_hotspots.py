"""Script de récupération et d'analyse des données GBIF.

Ce script interroge l'API GBIF pour obtenir les occurrences de certaines espèces
végétales, calcule une densité spatiale et propose les dix zones les plus riches
parmi les observations.
"""

import json
from typing import List

import pandas as pd
import requests

GBIF_API = "https://api.gbif.org/v1/occurrence/search"

SPECIES = [
    "Leopodium",
    "Beatome",
    "Recus",
]


def fetch_occurrences(species: str, limit: int = 300) -> pd.DataFrame:
    """Interroge l'API GBIF pour récupérer les occurrences d'une espèce."""
    params = {"scientificName": species, "hasCoordinate": True, "limit": limit}
    response = requests.get(GBIF_API, params=params)
    response.raise_for_status()
    data = response.json()
    records = data.get("results", [])
    return pd.DataFrame(records)


def main():
    all_records: List[pd.DataFrame] = []
    for sp in SPECIES:
        try:
            df = fetch_occurrences(sp)
            all_records.append(df)
            print(f"{len(df)} occurrences récupérées pour {sp}")
        except Exception as exc:
            print(f"Erreur lors de la récupération pour {sp}: {exc}")

    if not all_records:
        print("Aucune donnée récupérée.")
        return

    occurrences = pd.concat(all_records, ignore_index=True)
    occurrences.to_csv("occurrences.csv", index=False)
    print("Données enregistrées dans occurrences.csv")

    # TODO: calcul de densité spatiale et extraction des hotspots
    # Cette partie nécessitera l'utilisation de bibliothèques comme GeoPandas
    # et la création d'un raster KDE pour identifier les zones de forte densité.

if __name__ == "__main__":
    main()
