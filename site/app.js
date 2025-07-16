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

// -- LOGIQUE D'ANALYSE AUTOMATIQUE DES ESPÈCES PRÉDÉFINIES --

// Liste d'espèces à rechercher (hardcodée)
const PREDEFINED_SPECIES = [
  "Abies alba", "Acer pseudoplatanus", "Achillea erba-rotta subsp. moschata", "Achillea millefolium", 
  "Achillea ptarmica subsp. ptarmica", "Achillea ptarmica subsp. pyrenaica", "Aegopodium podagraria", 
  "Agrimonia eupatoria", "Ajuga chamaepitys", "Alliaria petiolata", "Allium ursinum", 
  "Angelica sylvestris", "Apium nodiflorum", "Arctium lappa", "Arctium nemorosum", 
  "Artemisia absinthium", "Atriplex halimus", "Bellis perennis", "Brassica nigra", 
  "Calendula arvensis", "Capsella bursa-pastoris", "Cardamine amara", "Cardamine flexuosa", 
  "Cardamine hirsuta", "Cardamine pratensis", "Chenopodium album", "Chenopodium bonus-henricus", 
  "Chrysosplenium oppositifolium", "Cichorium intybus", "Clinopodium grandiflorum", "Cornus mas", 
  "Crataegus monogyna", "Crepis bursifolia", "Crepis sancta", "Crepis vesicaria", 
  "Crithmum maritimum", "Daucus carota", "Diplotaxis erucoides", "Diplotaxis tenuifolia", 
  "Epilobium parviflorum", "Equisetum telmateia", "Fagus sylvatica", "Filipendula ulmaria", 
  "Foeniculum vulgare", "Fraxinus excelsior", "Fraxinus ornus", "Galinsoga parviflora", 
  "Geum urbanum", "Glechoma hederacea", "Helichrysum stoechas", "Heracleum sphondylium", 
  "Humulus lupulus", "Hypochaeris radicata", "Juniperus communis", "Lactuca muralis", 
  "Lactuca perennis", "Lactuca serriola", "Lamium galeobdolon", "Lamium maculatum", 
  "Lapsana communis subsp. communis", "Lapsana communis subsp. intermedia", "Legousia speculum-veneris", 
  "Lepidium draba", "Lepidium graminifolium", "Leucanthemum vulgare", "Lobularia maritima", 
  "Lunaria annua", "Lunaria rediviva", "Matricaria discoidea", "Melilotus officinalis", 
  "Mespilus germanica", "Morus nigra", "Nasturtium officinale", "Noccaea perfoliata", 
  "Origanum vulgare", "Ornithogalum pyrenaicum", "Oxalis corniculata", "Papaver rhoeas", 
  "Pastinaca sativa", "Persicaria hydropiper", "Peucedanum ostruthium", "Plantago coronopus", 
  "Plantago lanceolata", "Podospermum laciniatum", "Polypodium vulgare", "Populus nigra", 
  "Portulaca oleracea", "Potentilla anserina", "Poterium sanguisorba", "Primula veris", 
  "Prunus spinosa", "Pseudotsuga menziesii", "Quercus robur", "Reichardia picroides", 
  "Reynoutria japonica", "Robinia pseudoacacia", "Rumex acetosa", "Rumex acetosella", 
  "Rumex alpina", "Rumex intermedius", "Rumex pulcher", "Ruscus aculeatus", "Salicornia", 
  "Sambucus nigra", "Sanguisorba minor", "Saxifraga granulata", "Scandix pecten-veneris", 
  "Sedum album", "Sideritis romana", "Silene vulgaris", "Smyrnium olusatrum", "Solanum nigrum", 
  "Sonchus asper", "Sonchus oleraceus", "Sonchus tenerrimus", "Stachys arvensis", 
  "Stachys sylvatica", "Stellaria media", "Symphytum officinale", "Taraxacum sect. Ruderalia", 
  "Taraxacum sp.", "Tragopogon porrifolius", "Tussilago farfara", "Umbilicus rupestris", 
  "Urospermum dalechampii", "Urtica", "Vaccinium myrtillus", "Valerianella locusta", 
  "Valerianella sp.", "Veronica beccabunga", "Viola odorata"
];

let selectedPoint = null; // Stocke les coordonnées du point sélectionné par clic droit
let selectedPointMarker = null; // Marqueur visuel pour le point sélectionné
const ANALYSIS_RADIUS_KM = 10; // Rayon de 10 km pour l'analyse (MODIFIÉ)

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
    statusMessage.textContent = `Aucune observation trouvée pour les espèces prédéfinies dans le rayon de ${ANALYSIS_RADIUS_KM} km.`;
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
      }).bindPopup(`<b>${obs.scientificName || 'Nom inconnu'}</b><br>Source: GBIF<br>Date: ${obs.eventDate ? new Date(obs.eventDate).toLocaleDateString() : 'N/A'}<br>Latitude: ${obs.decimalLatitude}<br>Longitude: ${obs.decimalLongitude}`)
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

// Gestion du clic droit pour déclencher l'analyse automatique
map.on('contextmenu', async function(e) {
  selectedPoint = e.latlng;
  console.log('Clic droit détecté, point sélectionné:', selectedPoint);

  // Supprime l'ancien marqueur si il existe
  if (selectedPointMarker) {
    map.removeLayer(selectedPointMarker);
  }
  // Ajoute un nouveau marqueur pour le point sélectionné
  selectedPointMarker = L.marker(selectedPoint).addTo(map);

  // Création du contenu du popup pour confirmer l'analyse
  const popupContent = `
    <div>
        <p>Lancer l'analyse des espèces prédéfinies dans un rayon de ${ANALYSIS_RADIUS_KM} km autour de ce point ?</p>
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

  okButton.addEventListener('click', async () => {
    console.log('Bouton "OK" du popup cliqué. Lancement de l\'analyse...');
    map.closePopup(popup); // Ferme le popup

    statusMessage.textContent = `Recherche et analyse des ${PREDEFINED_SPECIES.length} espèces prédéfinies...`;
    statusMessage.style.color = 'blue';
    observationMarkers.clearLayers(); // Nettoyer les marqueurs précédents

    try {
      // Appel à la fonction Netlify pour toutes les espèces prédéfinies
      const response = await fetch(`/.netlify/functions/gbif-proxy?scientificNames=${encodeURIComponent(JSON.stringify(PREDEFINED_SPECIES))}`);
      console.log('Réponse du proxy GBIF reçue.');

      if (!response.ok) {
        const errorText = await response.text();
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
      const allObservations = Array.isArray(data.results) ? data.results : []; 
      console.log(`Proxy GBIF a agrégé ${allObservations.length} observations au total avant filtrage.`);

      if (allObservations.length === 0) {
        statusMessage.textContent = `Aucune observation trouvée pour les espèces prédéfinies.`;
        statusMessage.style.color = 'orange';
        return;
      }

      console.log(`Filtrage des observations autour de [${selectedPoint.lat}, ${selectedPoint.lng}] avec un rayon de ${ANALYSIS_RADIUS_KM} km.`);

      const filteredObservations = allObservations.filter(obs => {
          if (typeof obs.decimalLatitude === 'number' && typeof obs.decimalLongitude === 'number' && !isNaN(obs.decimalLatitude) && !isNaN(obs.decimalLongitude)) {
              const obsCoords = { lat: obs.decimalLatitude, lng: obs.decimalLongitude };
              const distance = haversineDistance(selectedPoint, obsCoords);
              return distance <= ANALYSIS_RADIUS_KM;
          }
          return false;
      });

      console.log(`${filteredObservations.length} observations filtrées dans le rayon.`);
      displayObservations(filteredObservations);
      statusMessage.textContent = `${filteredObservations.length} observations affichées dans un rayon de ${ANALYSIS_RADIUS_KM} km pour les espèces prédéfinies.`;
      statusMessage.style.color = 'green';

    } catch (error) {
      console.error("Erreur lors de la récupération ou de l'analyse des observations:", error);
      statusMessage.textContent = `Erreur lors de l'analyse: ${error.message}`;
      statusMessage.style.color = 'red';
    }
  });

  cancelButton.addEventListener('click', () => {
    console.log('Bouton "Annuler" du popup cliqué.');
    map.closePopup(popup); // Ferme le popup
    if (selectedPointMarker) {
        map.removeLayer(selectedPointMarker); // Retire le marqueur du point sélectionné
        selectedPointMarker = null;
    }
    selectedPoint = null; // Réinitialise le point sélectionné
    statusMessage.textContent = 'Analyse annulée.';
    statusMessage.style.color = 'grey';
  });
});
