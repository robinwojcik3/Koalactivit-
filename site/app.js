const map = L.map('map').setView([46.5, 2.5], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Affiche les hotspots s'ils existent
fetch('hotspots.geojson')
  .then((r) => r.json())
  .then((geo) => {
    L.geoJSON(geo, { style: { color: 'red' } }).addTo(map);
  })
  .catch(() => {
    console.log('Aucun fichier hotspots.geojson trouvé');
  });

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: { polyline: true, polygon: false, marker: false, circle: false, rectangle: false, circlemarker: false }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (event) {
  const layer = event.layer;
  drawnItems.clearLayers();
  drawnItems.addLayer(layer);
});

document.getElementById('save').addEventListener('click', async () => {
  if (drawnItems.getLayers().length === 0) {
    alert('Tracez un itinéraire avant de sauvegarder');
    return;
  }
  const geojson = drawnItems.toGeoJSON();
  const response = await fetch('/.netlify/functions/save-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geojson)
  });
  if (response.ok) {
    alert('Itinéraire sauvegardé');
  } else {
    const text = await response.text();
    alert('Erreur: ' + text);
  }
});
