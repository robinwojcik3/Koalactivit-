import requests
from collections import defaultdict
import folium
from folium.plugins import HeatMap

GBIF_OCCURRENCE_URL = "https://api.gbif.org/v1/occurrence/search"

def fetch_occurrences(species, limit=300):
    params = {
        "scientificName": species,
        "hasCoordinate": "true",
        "limit": limit
    }
    resp = requests.get(GBIF_OCCURRENCE_URL, params=params)
    resp.raise_for_status()
    data = resp.json()
    coords = []
    for rec in data.get("results", []):
        lat = rec.get("decimalLatitude")
        lon = rec.get("decimalLongitude")
        if lat is not None and lon is not None:
            coords.append((lat, lon))
    return coords

def grid_hotspots(coords, grid_size=1.0, top_n=10):
    counts = defaultdict(int)
    for lat, lon in coords:
        cell = (round(lat / grid_size) * grid_size,
                round(lon / grid_size) * grid_size)
        counts[cell] += 1
    sorted_cells = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return [(cell[0], cell[1], count) for cell, count in sorted_cells[:top_n]]

def create_heatmap(coords, output_html="hotspots_map.html"):
    if not coords:
        raise ValueError("No coordinates to plot")
    center = [sum(p[0] for p in coords)/len(coords),
              sum(p[1] for p in coords)/len(coords)]
    m = folium.Map(location=center, zoom_start=5)
    HeatMap(coords).add_to(m)
    m.save(output_html)
    return output_html

if __name__ == "__main__":
    species = [
        "Eucalyptus globulus",
        "Eucalyptus camaldulensis",
        "Eucalyptus tereticornis",
        "Eucalyptus robusta"
    ]
    all_coords = []
    for sp in species:
        print(f"Fetching occurrences for {sp}...")
        try:
            all_coords.extend(fetch_occurrences(sp))
        except Exception as e:
            print("Failed to fetch", sp, e)
    print(f"Fetched {len(all_coords)} total occurrences")
    hotspots = grid_hotspots(all_coords)
    for lat, lon, count in hotspots:
        print(f"Hotspot {lat}, {lon} - {count} records")
    output = create_heatmap(all_coords)
    print("Heatmap saved to", output)
