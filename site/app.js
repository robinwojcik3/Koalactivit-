const map = L.map('map').setView([46.5, 2.5], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const statusMessage = document.getElementById('status-message');

console.log('App démarrée : Tentative de chargement des hotspots...');
// Affiche les hotspots s'ils existent
fetch('hotspots.geojson')
  .then((r) => {
    if (!r.ok) {
      throw new Error(`Erreur HTTP: ${r.status}`);
    }
    return r.json();
  })
  .then((geo) => {
    L.geoJSON(geo, { style: { color: 'red', weight: 2, opacity: 0.8 } }).addTo(map);
    console.log('Hotspots chargés avec succès.');
  })
  .catch((error) => {
    console.log('Aucun fichier hotspots.geojson trouvé ou erreur de chargement:', error.message);
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
  console.log('Itinéraire créé.');
});

document.getElementById('save').addEventListener('click', async () => {
  console.log('Bouton "Sauvegarder l\'itinéraire" cliqué.');
  if (drawnItems.getLayers().length === 0) {
    statusMessage.textContent = 'Erreur: Tracez un itinéraire avant de sauvegarder.';
    statusMessage.style.color = 'red';
    console.warn('Tentative de sauvegarde sans itinéraire tracé.');
    return;
  }
  const geojson = drawnItems.toGeoJSON();
  console.log('Itinéraire à sauvegarder:', geojson);
  try {
    const response = await fetch('/.netlify/functions/save-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geojson)
    });
    if (response.ok) {
      statusMessage.textContent = 'Itinéraire sauvegardé avec succès.';
      statusMessage.style.color = 'green';
      console.log('Sauvegarde réussie.');
    } else {
      const text = await response.text();
      statusMessage.textContent = 'Erreur de sauvegarde: ' + text;
      statusMessage.style.color = 'red';
      console.error('Erreur lors de la sauvegarde (réponse non OK):', response.status, text);
    }
  } catch (error) {
    statusMessage.textContent = 'Erreur de sauvegarde réseau: ' + error.message;
    statusMessage.style.color = 'red';
    console.error('Erreur réseau lors de la sauvegarde:', error);
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
  console.log('Clic droit détecté, point sélectionné:', selectedPoint);

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
  console.log('Bouton "Afficher les observations" cliqué.');
  const speciesName = document.getElementById('species-input').value.trim();
  if (!speciesName) {
    statusMessage.textContent = 'Veuillez entrer un nom d\'espèce.';
    statusMessage.style.color = 'orange';
    console.warn('Nom d\'espèce vide.');
    return;
  }

  statusMessage.textContent = `Recherche des observations pour "${speciesName}"...`;
  statusMessage.style.color = 'blue';
  console.log(`Recherche GBIF pour: ${speciesName}`);

  // Effacer les marqueurs précédents et les observations stockées
  observationMarkers.clearLayers();
  allObservations = []; 

  try {
    const response = await fetch(`/.netlify/functions/gbif-proxy?scientificName=${encodeURIComponent(speciesName)}`);
    console.log('Réponse du proxy GBIF reçue.');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Statut HTTP: ${response.status}, Erreur: ${errorText}`);
    }
    const data = await response.json();
    allObservations = data.results; // Stocker toutes les observations récupérées
    console.log(`GBIF a retourné ${allObservations ? allObservations.length : 0} résultats.`);

    if (!allObservations || allObservations.length === 0) {
      statusMessage.textContent = `Aucune observation trouvée pour "${speciesName}".`;
      statusMessage.style.color = 'orange';
      return;
    }

    statusMessage.textContent = `${allObservations.length} observations trouvées pour "${speciesName}". Sélectionnez un point sur la carte pour affiner l'analyse.`;
    statusMessage.style.color = 'green';

    // Afficher toutes les observations initialement après une recherche.
    // C'est souvent le comportement attendu par l'utilisateur.
    displayObservations(allObservations, false); // Le second paramètre indique de ne pas afficher le message de rayon ici.

  } catch (error) {
    console.error("Erreur lors de la récupération des observations GBIF:", error);
    statusMessage.textContent = `Erreur lors de la recherche: ${error.message}`;
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
function displayObservations(observationsToDisplay, showRadiusMessage = true) {
  observationMarkers.clearLayers(); // Nettoyer les marqueurs existants
  console.log(`Affichage de ${observationsToDisplay.length} observations.`);

  if (observationsToDisplay.length === 0) {
    if (showRadiusMessage) {
        statusMessage.textContent = `Aucune observation trouvée dans le rayon de ${ANALYSIS_RADIUS_KM} km autour du point sélectionné.`;
        statusMessage.style.color = 'orange';
    } else {
        statusMessage.textContent = `Aucune observation à afficher.`; // Cas où il n'y a rien du tout
        statusMessage.style.color = 'orange';
    }
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
      }).bindPopup(`<b>${obs.scientificName || 'Nom inconnu'}</b><br>Source: GBIF<br>Latitude: ${obs.decimalLatitude}<br>Longitude: ${obs.decimalLongitude}`)
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
  console.log('Bouton "Lancer l\'analyse de proximité" cliqué.');
  if (!selectedPoint) {
    statusMessage.textContent = 'Veuillez d\'abord sélectionner un point sur la carte avec un clic droit.';
    statusMessage.style.color = 'red';
    console.warn('Tentative d\'analyse sans point sélectionné.');
    return;
  }

  if (allObservations.length === 0) {
    statusMessage.textContent = 'Veuillez d\'abord rechercher des observations d\'espèces pour pouvoir les filtrer.';
    statusMessage.style.color = 'orange';
    console.warn('Tentative d\'analyse sans observations préalablement recherchées.');
    return;
  }

  statusMessage.textContent = `Analyse en cours pour les observations dans un rayon de ${ANALYSIS_RADIUS_KM} km autour du point sélectionné...`;
  statusMessage.style.color = 'blue';
  console.log(`Filtrage des observations autour de [${selectedPoint.lat}, ${selectedPoint.lng}] avec un rayon de ${ANALYSIS_RADIUS_KM} km.`);

  const filteredObservations = allObservations.filter(obs => {
    if (obs.decimalLatitude && obs.decimalLongitude) {
      const obsCoords = { lat: obs.decimalLatitude, lng: obs.decimalLongitude };
      const distance = haversineDistance(selectedPoint, obsCoords);
      // console.log(`Obs: [${obs.decimalLatitude}, ${obs.decimalLongitude}], Dist: ${distance.toFixed(2)} km`); // Débogage des distances
      return distance <= ANALYSIS_RADIUS_KM;
    }
    return false;
  });

  console.log(`${filteredObservations.length} observations filtrées.`);
  displayObservations(filteredObservations);
  statusMessage.textContent = `${filteredObservations.length} observations affichées dans un rayon de ${ANALYSIS_RADIUS_KM} km.`;
  statusMessage.style.color = 'green';
});
