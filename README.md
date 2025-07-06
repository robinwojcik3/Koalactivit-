# Koala Activity Toolkit

This repository contains simple tools for locating suitable areas for koala
activities and planning routes. The examples rely on public APIs and Python.

## Hotspot identification with the GBIF API

The script `koala_map/hotspots.py` downloads occurrence records for several
Eucalyptus species from the GBIF API. It aggregates the coordinates on a grid to
highlight areas with many records and produces a heatmap.

Usage:

```bash
python3 koala_map/hotspots.py
```

The script prints the ten most represented grid cells and creates an HTML map
(`hotspots_map.html`). Internet access is required to contact the GBIF API.

## Drawing and saving itineraries

`koala_map/map_app.py` provides a tiny Flask application serving an interactive
map (powered by Folium and Leaflet). You can draw lines or polygons on the map.
Each new drawing triggers a POST request to `/save` that appends the GeoJSON
geometry to a local `routes.json` file.

Run the server with:

```bash
python3 koala_map/map_app.py
```

Then open `http://localhost:5000` in your browser to draw routes. The collected
routes are stored in `routes.json`.

## Uploading routes to GitHub

`koala_map/github_upload.py` demonstrates how to push the `routes.json` file to a
GitHub repository using the GitHub API. Set environment variables `GITHUB_TOKEN`
(a personal access token) and `GITHUB_REPO` (e.g. `user/repo`) before running

```bash
python3 koala_map/github_upload.py
```

This will create or update `routes.json` in the specified repository.

## Requirements

- Python 3
- `requests`
- `folium`
- `flask`

Install dependencies with:

```bash
pip install requests folium flask
```
