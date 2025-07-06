"""Script de récupération et d'analyse des données GBIF.

Ce script interroge l'API GBIF pour obtenir les occurrences de certaines espèces
végétales, calcule une densité spatiale et propose les dix zones les plus riches
parmi les observations.
"""

import json
from typing import List

import pandas as pd
import requests
import numpy as np
import geopandas as gpd
from shapely.geometry import box

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


def compute_hotspots(df: pd.DataFrame, bins: int = 100, top_n: int = 10) -> gpd.GeoDataFrame:
    """Calcule les hotspots de densité parmi les occurrences."""
    coords = df[["decimalLongitude", "decimalLatitude"]].dropna().astype(float)
    if coords.empty:
        return gpd.GeoDataFrame(columns=["geometry", "count"], crs="EPSG:4326")

    x = coords["decimalLongitude"].values
    y = coords["decimalLatitude"].values
    heatmap, xedges, yedges = np.histogram2d(x, y, bins=bins)
    flat_indices = heatmap.ravel().argsort()[::-1]

    hotspots = []
    for idx in flat_indices[:top_n]:
        count = int(heatmap.ravel()[idx])
        if count == 0:
            break
        xi, yi = np.unravel_index(idx, heatmap.shape)
        xmin, xmax = xedges[xi], xedges[xi + 1]
        ymin, ymax = yedges[yi], yedges[yi + 1]
        poly = box(xmin, ymin, xmax, ymax)
        hotspots.append({"geometry": poly, "count": count})

    return gpd.GeoDataFrame(hotspots, crs="EPSG:4326")


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

    hotspots = compute_hotspots(occurrences)
    if hotspots.empty:
        print("Impossible de calculer les hotspots")
        return

    hotspots.to_file("hotspots.geojson", driver="GeoJSON")
    print("Hotspots enregistrés dans hotspots.geojson")
    print(hotspots[["count"]])

if __name__ == "__main__":
    main()

