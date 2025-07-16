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

// -- Logique pour l'affichage des observations d'espèces et le filtrage par rayon --

// Variable globale pour stocker toutes les observations récupérées
let allObservations = [];
let selectedPoint = null; // Stocke les coordonnées du point sélectionné par clic droit
let selectedPointMarker = null; // Marqueur visuel pour le point sélectionné
const ANALYSIS_RADIUS_KM = 40; // Rayon de 40 km pour l'analyse

// Gestion du clic droit pour sélectionner un point d'intérêt
map.on('contextmenu', function(e) {
  selectedPoint = e.latlng;

  // Supprime l'ancien marqueur si il existe
  if (selectedPointMarker) {
    map.removeLayer(selectedPointMarker);
  }
  // Ajoute un nouveau marqueur pour le point sélectionné
  selectedPointMarker = L.marker(selectedPoint).addTo(map)
    .bindPopup(`Point d'analyse sélectionné ici:<br>Lat: ${selectedPoint.lat.toFixed(4)}, Lng: ${selectedPoint.lng.toFixed(4)}`)
    .openPopup();

  statusMessage.textContent = `Point sélectionné: Latitude ${selectedPoint.lat.toFixed(4)}, Longitude ${selectedPoint.lng.toFixed(4)}. Cliquez sur "Lancer l'analyse de proximité".`;
  statusMessage.style.color = 'blue';
  document.getElementById('analyze-button').disabled = false; // Activer le bouton d'analyse
});

document.getElementById('search-species').addEventListener('click', async () => {
  const speciesName = document.getElementById('species-input').value.trim();
  if (!speciesName) {
    statusMessage.textContent = 'Veuillez entrer un nom d\'espèce.';
    statusMessage.style.color = 'orange';
    return;
  }

  statusMessage.textContent = `Recherche des observations pour "${speciesName}"...`;
  statusMessage.style.color = 'blue';

  // Effacer les marqueurs précédents et les observations stockées
  observationMarkers.clearLayers();
  allObservations = []; 

  try {
    const response = await fetch(`/.netlify/functions/gbif-proxy?scientificName=${encodeURIComponent(speciesName)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    const data = await response.json();
    allObservations = data.results; // Stocker toutes les observations récupérées

    if (!allObservations || allObservations.length === 0) {
      statusMessage.textContent = `Aucune observation trouvée pour "${speciesName}".`;
      statusMessage.style.color = 'orange';
      return;
    }

    statusMessage.textContent = `${allObservations.length} observations trouvées pour "${speciesName}". Sélectionnez un point sur la carte pour affiner l'analyse.`;
    statusMessage.style.color = 'green';

    // N'affiche pas toutes les observations par défaut après une recherche,
    // mais attend le clic sur "Lancer l'analyse de proximité" si un point est sélectionné.
    // Si aucun point n'est sélectionné, elles peuvent être affichées ou attendre l'action de l'utilisateur.
    // Pour l'instant, on n'affiche rien tant que l'analyse n'est pas lancée après une sélection de point.
    // Si vous voulez qu'elles s'affichent toutes par défaut et soient ensuite filtrées, décommentez la ligne ci-dessous :
    // displayObservations(allObservations);

  } catch (error) {
    console.error("Erreur lors de la récupération des observations:", error);
    statusMessage.textContent = `Erreur: ${error.message}`;
    statusMessage.style.color = 'red';
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
  observationMarkers.clearLayers(); // Nettoyer les marqueurs existants
  if (observationsToDisplay.length === 0) {
    statusMessage.textContent = `Aucune observation trouvée dans le rayon de ${ANALYSIS_RADIUS_KM} km autour du point sélectionné.`;
    statusMessage.style.color = 'orange';
    return;
  }

  observationsToDisplay.forEach(obs => {
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

  // Ajuster la vue de la carte pour inclure toutes les observations affichées
  if (observationMarkers.getLayers().length > 0) {
    map.fitBounds(observationMarkers.getBounds().pad(0.1));
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
    statusMessage.textContent = 'Veuillez d\'abord rechercher des observations d\'espèces pour pouvoir les filtrer.';
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
