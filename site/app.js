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
const ANALYSIS_RADIUS_KM = 20; // Rayon de 20 km pour l'analyse

// Gestion du clic droit pour sélectionner un point d'intérêt
map.on('contextmenu', function(e) {
  selectedPoint = e.latlng;
  console.log('Clic droit détecté, point sélectionné:', selectedPoint);

  // Supprime l'ancien marqueur si il existe
  if (selectedPointMarker) {
    map.removeLayer(selectedPointMarker);
  }
  // Ajoute un nouveau marqueur pour le point sélectionné
  selectedPointMarker = L.marker(selectedPoint).addTo(map);

  // Création du contenu du popup
  const popupContent = `
    <div>
        <p>Afficher les observations dans un rayon de ${ANALYSIS_RADIUS_KM} km ici ?</p>
        <button class="ok-button">OK</button>
        <button class="cancel-button">Annuler</button>
    </div>
  `;

  const popup = L.popup()
    .setLatLng(selectedPoint)
    .setContent(popupContent)
    .openOn(map);

  // Ajout des écouteurs d'événements aux boutons du popup
  const okButton = popup.getElement().querySelector('.ok-button');
  const cancelButton = popup.getElement().querySelector('.cancel-button');

  okButton.addEventListener('click', () => {
    console.log('Bouton "OK" du popup cliqué.');
    map.closePopup(popup); // Ferme le popup

    if (!allObservations || allObservations.length === 0) { // Vérifie si des observations ont été trouvées et stockées
        statusMessage.textContent = 'Veuillez d\'abord rechercher des observations d\'espèces pour pouvoir les filtrer.';
        statusMessage.style.color = 'orange';
        console.warn('Tentative d\'analyse sans observations préalablement recherchées (allObservations est vide ou null).');
        return;
    }
    
    console.log(`Nombre total d'observations disponibles avant filtrage: ${allObservations.length}`);


    statusMessage.textContent = `Analyse en cours pour les observations dans un rayon de ${ANALYSIS_RADIUS_KM} km autour du point sélectionné...`;
    statusMessage.style.color = 'blue';
    console.log(`Filtrage des observations autour de [${selectedPoint.lat}, ${selectedPoint.lng}] avec un rayon de ${ANALYSIS_RADIUS_KM} km.`);

    const filteredObservations = allObservations.filter(obs => {
        // Vérifie si les coordonnées de l'observation sont valides
        if (typeof obs.decimalLatitude === 'number' && typeof obs.decimalLongitude === 'number') {
            const obsCoords = { lat: obs.decimalLatitude, lng: obs.decimalLongitude };
            const distance = haversineDistance(selectedPoint, obsCoords);
            // console.log(`Obs: [${obs.decimalLatitude}, ${obs.decimalLongitude}], Dist: ${distance.toFixed(2)} km`); // Débogage des distances
            return distance <= ANALYSIS_RADIUS_KM;
        }
        console.warn('Observation avec coordonnées invalides, ignorée:', obs); // Log pour déboguer les données corrompues
        return false;
    });

    console.log(`${filteredObservations.length} observations filtrées.`);
    displayObservations(filteredObservations);
    statusMessage.textContent = `${filteredObservations.length} observations affichées dans un rayon de ${ANALYSIS_RADIUS_KM} km.`;
    statusMessage.style.color = 'green';
  });

  cancelButton.addEventListener('click', () => {
    console.log('Bouton "Annuler" du popup cliqué.');
    map.closePopup(popup); // Ferme le popup
    if (selectedPointMarker) {
        map.removeLayer(selectedPointMarker); // Retire le marqueur du point sélectionné
        selectedPointMarker = null;
    }
    selectedPoint = null; // Réinitialise le point sélectionné
    statusMessage.textContent = 'Analyse de proximité annulée.';
    statusMessage.style.color = 'grey';
  });
});

document.getElementById('search-species').addEventListener('click', async () => {
  console.log('Bouton "Rechercher les observations" cliqué.');
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

  // Effacer les marqueurs précédents (sauf le point sélectionné s'il existe)
  observationMarkers.clearLayers();
  allObservations = []; // Réinitialiser avant chaque nouvelle recherche

  try {
    const response = await fetch(`/.netlify/functions/gbif-proxy?scientificName=${encodeURIComponent(speciesName)}`);
    console.log('Réponse du proxy GBIF reçue.');
    if (!response.ok) {
      const errorText = await response.text();
      // Tente de parser l'erreur JSON si c'est le cas, sinon utilise le texte brut
      let errorMessage = `Statut HTTP: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) errorMessage += `, Erreur: ${errorJson.message}`;
        else errorMessage += `, Erreur: ${errorText}`;
      } catch (e) {
        errorMessage += `, Erreur: ${errorText}`;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    // Assurez-vous que data.results est un tableau, même s'il est vide ou absent
    allObservations = Array.isArray(data.results) ? data.results : []; 
    console.log(`GBIF a retourné ${allObservations.length} résultats.`);

    if (allObservations.length === 0) {
      statusMessage.textContent = `Aucune observation trouvée pour "${speciesName}".`;
      statusMessage.style.color = 'orange';
      return;
    }

    statusMessage.textContent = `${allObservations.length} observations trouvées pour "${speciesName}". Faites un clic droit sur la carte pour lancer l'analyse de proximité.`;
    statusMessage.style.color = 'green';

    // Ne plus afficher toutes les observations globalement après une recherche.
    // L'affichage est désormais déclenché par l'analyse de proximité via le clic droit.

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
function displayObservations(observationsToDisplay) {
  observationMarkers.clearLayers(); // Nettoyer les marqueurs existants
  console.log(`displayObservations: Tentative d'affichage de ${observationsToDisplay.length} observations.`);

  if (observationsToDisplay.length === 0) {
    statusMessage.textContent = `Aucune observation trouvée dans le rayon de ${ANALYSIS_RADIUS_KM} km autour du point sélectionné.`;
    statusMessage.style.color = 'orange';
    // Si selectedPointMarker existe, on le laisse visible pour montrer le point d'analyse.
    return;
  }

  observationsToDisplay.forEach(obs => {
    // Vérifie si decimalLatitude et decimalLongitude sont des nombres valides avant de créer le marqueur
    if (typeof obs.decimalLatitude === 'number' && typeof obs.decimalLongitude === 'number' && !isNaN(obs.decimalLatitude) && !isNaN(obs.decimalLongitude)) {
      L.circleMarker([obs.decimalLatitude, obs.decimalLongitude], {
        radius: 4,
        color: '#007bff',
        fillColor: '#007bff',
        fillOpacity: 0.7,
        weight: 1
      }).bindPopup(`<b>${obs.scientificName || 'Nom inconnu'}</b><br>Source: GBIF<br>Latitude: ${obs.decimalLatitude}<br>Longitude: ${obs.decimalLongitude}`)
        .addTo(observationMarkers);
    } else {
        console.warn('Coordonnées d\'observation invalides, marqueur non créé:', obs);
    }
  });

  // Ajuster la vue de la carte pour inclure toutes les observations affichées ET le point sélectionné
  if (observationMarkers.getLayers().length > 0) {
    const bounds = observationMarkers.getBounds();
    if (selectedPointMarker) {
        bounds.extend(selectedPointMarker.getLatLng());
    }
    map.fitBounds(bounds.pad(0.1));
  } else if (selectedPointMarker) {
      // Si aucune observation filtrée mais un point sélectionné, centrer sur le point
      map.setView(selectedPointMarker.getLatLng(), map.getZoom());
  }
}
