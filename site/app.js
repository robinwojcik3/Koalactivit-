const map = L.map('map').setView([46.5, 2.5], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const statusMessage = document.getElementById('status-message');

// Affiche les hotspots s'ils existent
fetch('hotspots.geojson')
  .then((r) => r.json())
  .then((geo) => {
    L.geoJSON(geo, { style: { color: 'red', weight: 2, opacity: 0.8 } }).addTo(map);
  })
  .catch(() => {
    console.log('Aucun fichier hotspots.geojson trouvé');
  });

// Couche pour les itinéraires dessinés
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Couche pour les marqueurs d'observations GBIF
const observationMarkers = new L.FeatureGroup();
map.addLayer(observationMarkers);

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
    statusMessage.textContent = 'Erreur: Tracez un itinéraire avant de sauvegarder.';
    statusMessage.style.color = 'red';
    return;
  }
  const geojson = drawnItems.toGeoJSON();
  const response = await fetch('/.netlify/functions/save-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geojson)
  });
  if (response.ok) {
    statusMessage.textContent = 'Itinéraire sauvegardé avec succès.';
    statusMessage.style.color = 'green';
  } else {
    const text = await response.text();
    statusMessage.textContent = 'Erreur de sauvegarde: ' + text;
    statusMessage.style.color = 'red';
  }
});

// -- Logique pour l'affichage des observations d'espèces --
document.getElementById('search-species').addEventListener('click', async () => {
  const speciesName = document.getElementById('species-input').value.trim();
  if (!speciesName) {
    statusMessage.textContent = 'Veuillez entrer un nom d\'espèce.';
    statusMessage.style.color = 'orange';
    return;
  }

  statusMessage.textContent = `Recherche des observations pour "${speciesName}"...`;
  statusMessage.style.color = 'blue';

  // Effacer les marqueurs précédents
  observationMarkers.clearLayers();

  try {
    const response = await fetch(`/.netlify/functions/gbif-proxy?scientificName=${encodeURIComponent(speciesName)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    const data = await response.json();
    const observations = data.results;

    if (!observations || observations.length === 0) {
      statusMessage.textContent = `Aucune observation trouvée pour "${speciesName}".`;
      statusMessage.style.color = 'orange';
      return;
    }

    observations.forEach(obs => {
      if (obs.decimalLatitude && obs.decimalLongitude) {
        L.circleMarker([obs.decimalLatitude, obs.decimalLongitude], {
          radius: 4,
          color: '#007bff',
          fillColor: '#007bff',
          fillOpacity: 0.7,
          weight: 1
        }).bindPopup(`<b>${obs.scientificName}</b><br>Source: GBIF`)
          .addTo(observationMarkers);
      }
    });

    if (observationMarkers.getLayers().length > 0) {
      map.fitBounds(observationMarkers.getBounds().pad(0.1));
    }
    statusMessage.textContent = `${observations.length} observations affichées pour "${speciesName}".`;
    statusMessage.style.color = 'green';

  } catch (error) {
    console.error("Erreur lors de la récupération des observations:", error);
    statusMessage.textContent = `Erreur: ${error.message}`;
    statusMessage.style.color = 'red';
  }
});
