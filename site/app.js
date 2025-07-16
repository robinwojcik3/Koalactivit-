[cite_start]const map = L.map('map').setView([46.5, 2.5], 6); [cite: 150]
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
[cite_start]}).addTo(map); [cite: 151]

[cite_start]const statusMessage = document.getElementById('status-message'); [cite: 151]

[cite_start]// Affiche les hotspots s'ils existent [cite: 152]
fetch('hotspots.geojson')
  [cite_start].then((r) => r.json()) [cite: 153]
  .then((geo) => {
    [cite_start]L.geoJSON(geo, { style: { color: 'red', weight: 2, opacity: 0.8 } }).addTo(map); [cite: 153]
  })
  .catch(() => {
    [cite_start]console.log('Aucun fichier hotspots.geojson trouvé'); [cite: 154]
  });

[cite_start]// Couche pour les itinéraires dessinés [cite: 155]
[cite_start]const drawnItems = new L.FeatureGroup(); [cite: 155]
[cite_start]map.addLayer(drawnItems); [cite: 155]

[cite_start]// Couche pour les marqueurs d'observations GBIF [cite: 156]
[cite_start]const observationMarkers = new L.FeatureGroup(); [cite: 156]
[cite_start]map.addLayer(observationMarkers); [cite: 156]

const drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: { polyline: true, polygon: false, marker: false, circle: false, rectangle: false, circlemarker: false }
[cite_start]}); [cite: 157]
[cite_start]map.addControl(drawControl); [cite: 158]

map.on(L.Draw.Event.CREATED, function (event) {
  const layer = event.layer;
  drawnItems.clearLayers();
  drawnItems.addLayer(layer);
[cite_start]}); [cite: 159]

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
  [cite_start]}); [cite: 160]
  if (response.ok) {
    statusMessage.textContent = 'Itinéraire sauvegardé avec succès.';
    statusMessage.style.color = 'green';
  } else {
    const text = await response.text();
    statusMessage.textContent = 'Erreur de sauvegarde: ' + text;
    statusMessage.style.color = 'red';
  }
[cite_start]}); [cite: 160]

[cite_start]// -- Logique pour l'affichage des observations d'espèces -- [cite: 161]

// Variable globale pour stocker toutes les observations récupérées
let allObservations = [];
let selectedPoint = null;
const ANALYSIS_RADIUS_KM = 40; // Rayon de 40 km pour l'analyse

// Gestion du clic droit pour sélectionner un point d'intérêt
map.on('contextmenu', function(e) {
  selectedPoint = e.latlng;
  statusMessage.textContent = `Point sélectionné: Latitude ${selectedPoint.lat.toFixed(4)}, Longitude ${selectedPoint.lng.toFixed(4)}. Cliquez sur "Lancer l'analyse de proximité".`;
  statusMessage.style.color = 'blue';
  document.getElementById('analyze-button').disabled = false; // Activer le bouton d'analyse
});

document.getElementById('search-species').addEventListener('click', async () => {
  [cite_start]const speciesName = document.getElementById('species-input').value.trim(); [cite: 162]
  if (!speciesName) {
    [cite_start]statusMessage.textContent = 'Veuillez entrer un nom d\'espèce.'; [cite: 163]
    [cite_start]statusMessage.style.color = 'orange'; [cite: 163]
    return;
  }

  [cite_start]statusMessage.textContent = `Recherche des observations pour "${speciesName}"...`; [cite: 162]
  [cite_start]statusMessage.style.color = 'blue'; [cite: 162]

  [cite_start]// Effacer les marqueurs précédents [cite: 163]
  [cite_start]observationMarkers.clearLayers(); [cite: 163]
  allObservations = []; // Réinitialiser la liste complète des observations

  [cite_start]try { [cite: 163]
    [cite_start]const response = await fetch(`/.netlify/functions/gbif-proxy?scientificName=${encodeURIComponent(speciesName)}`); [cite: 163]
    if (!response.ok) {
      [cite_start]const errorText = await response.text(); [cite: 163]
      [cite_start]throw new Error(errorText); [cite: 163]
    }
    [cite_start]const data = await response.json(); [cite: 163]
    allObservations = data.results; // Stocker toutes les observations récupérées

    [cite_start]if (!allObservations || allObservations.length === 0) { [cite: 164]
      [cite_start]statusMessage.textContent = `Aucune observation trouvée pour "${speciesName}".`; [cite: 164]
      [cite_start]statusMessage.style.color = 'orange'; [cite: 164]
      [cite_start]return; [cite: 165]
    }

    // Afficher toutes les observations initialement
    displayObservations(allObservations);
    
    [cite_start]statusMessage.textContent = `${allObservations.length} observations affichées pour "${speciesName}".`; [cite: 168]
    [cite_start]statusMessage.style.color = 'green'; [cite: 168]

  [cite_start]} catch (error) { [cite: 169]
    [cite_start]console.error("Erreur lors de la récupération des observations:", error); [cite: 170]
    [cite_start]statusMessage.textContent = `Erreur: ${error.message}`; [cite: 170]
    [cite_start]statusMessage.style.color = 'red'; [cite: 170]
  }
});

// Fonction pour calculer la distance entre deux points (formule de Haversine simplifiée)
function haversineDistance(coords1, coords2) {
  const R = 6371; // Rayon de la Terre en kilomètres
  const lat1 = coords1.lat * Math.PI / 180;
  const lon1 = coords1.lng * Math.PI / 180;
  const lat2 = coords2.lat * Math.PI / 180;
  const lon2 = coords2.lng * Math.PI / 180;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en km
}

// Fonction pour afficher les observations sur la carte
function displayObservations(observationsToDisplay) {
  observationMarkers.clearLayers();
  observationsToDisplay.forEach(obs => {
    if (obs.decimalLatitude && obs.decimalLongitude) {
      L.circleMarker([obs.decimalLatitude, obs.decimalLongitude], {
        radius: 4,
        color: '#007bff',
        fillColor: '#007bff',
        fillOpacity: 0.7,
        weight: 1
      [cite_start]}).bindPopup(`<b>${obs.scientificName}</b><br>Source: GBIF`) [cite: 166]
        [cite_start].addTo(observationMarkers); [cite: 166]
    }
  });

  if (observationMarkers.getLayers().length > 0) {
    [cite_start]map.fitBounds(observationMarkers.getBounds().pad(0.1)); [cite: 167]
  } else {
    statusMessage.textContent = `Aucune observation trouvée dans le rayon de ${ANALYSIS_RADIUS_KM} km.`;
    statusMessage.style.color = 'orange';
  }
}

// Gestion du bouton "Lancer l'analyse de proximité"
document.getElementById('analyze-button').addEventListener('click', () => {
  if (!selectedPoint) {
    statusMessage.textContent = 'Veuillez d\'abord sélectionner un point sur la carte avec un clic droit.';
    statusMessage.style.color = 'red';
    return;
  }

  if (allObservations.length === 0) {
    statusMessage.textContent = 'Veuillez d\'abord rechercher des observations d\'espèces.';
    statusMessage.style.color = 'orange';
    return;
  }

  statusMessage.textContent = `Analyse en cours pour les observations dans un rayon de ${ANALYSIS_RADIUS_KM} km autour du point sélectionné...`;
  statusMessage.style.color = 'blue';

  const filteredObservations = allObservations.filter(obs => {
    if (obs.decimalLatitude && obs.decimalLongitude) {
      const obsCoords = { lat: obs.decimalLatitude, lng: obs.decimalLongitude };
      return haversineDistance(selectedPoint, obsCoords) <= ANALYSIS_RADIUS_KM;
    }
    return false;
  });

  displayObservations(filteredObservations);
  statusMessage.textContent = `${filteredObservations.length} observations affichées dans un rayon de ${ANALYSIS_RADIUS_KM} km.`;
  statusMessage.style.color = 'green';
});
