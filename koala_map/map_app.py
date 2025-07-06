from flask import Flask, render_template_string, request, jsonify
import folium
from folium.plugins import Draw
import json
import os

app = Flask(__name__)
ROUTE_FILE = "routes.json"

HTML_TEMPLATE = """
<!doctype html>
<html>
<head>
<meta charset='utf-8'>
<title>Koala Route Planner</title>
<style>html, body {height: 100%; margin: 0;}</style>
{{ folium_map|safe }}
<script src='https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js'></script>
<script>
function setup() {
  var map = window.map;
  map.on('draw:created', function(e) {
    var geojson = e.layer.toGeoJSON();
    axios.post('/save', geojson).then(function() {
      alert('Route saved');
    });
  });
}
if (window.map) { setup(); } else { document.addEventListener('DOMContentLoaded', setup); }
</script>
</head>
<body></body>
</html>
"""

@app.route('/')
def index():
    m = folium.Map(location=[-25, 133], zoom_start=4)
    Draw(export=True).add_to(m)
    html = m.get_root().render()
    return render_template_string(HTML_TEMPLATE, folium_map=html)

@app.route('/save', methods=['POST'])
def save():
    data = request.get_json()
    if os.path.exists(ROUTE_FILE):
        with open(ROUTE_FILE, 'r') as f:
            routes = json.load(f)
    else:
        routes = []
    routes.append(data)
    with open(ROUTE_FILE, 'w') as f:
        json.dump(routes, f, indent=2)
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True)
