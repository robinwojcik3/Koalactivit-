"""Prototype de carte interactive pour tracer et sauvegarder des itinéraires."""

import json
from pathlib import Path

import folium


def create_map() -> folium.Map:
    """Crée une carte Leaflet centrée sur la France."""
    m = folium.Map(location=[46.5, 2.5], zoom_start=6)
    folium.TileLayer("OpenStreetMap").add_to(m)
    return m


def save_route(coordinates, filename: str = "itinerary.geojson"):
    """Enregistre la liste de coordonnées au format GeoJSON."""
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates,
                },
            }
        ],
    }

    Path(filename).write_text(json.dumps(geojson, indent=2))
    print(f"Itinéraire sauvegardé dans {filename}")


if __name__ == "__main__":
    # Exemple d'utilisation : création d'une carte simple
    m = create_map()
    m.save("map.html")
    print("Carte enregistrée dans map.html")
    # Pour le traçage interactif, l'intégration dans un framework web est
    # recommandée (Flask, Streamlit, etc.)
