const fetch = require('node-fetch'); // Importation de node-fetch pour les requêtes HTTP

exports.handler = async function(event, context) {
  // Vérifie que la méthode est GET et qu'il y a des paramètres de requête
  if (event.httpMethod !== 'GET' || !event.queryStringParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Méthode non supportée ou paramètres manquants.' }),
    };
  }

  // Récupère les noms scientifiques depuis les paramètres de la requête
  // S'attend à une chaîne JSON d'un tableau de noms, par exemple: ?scientificNames=["Abies alba","Acer pseudoplatanus"]
  const scientificNamesParam = event.queryStringParameters.scientificNames;

  if (!scientificNamesParam) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Le paramètre scientificNames est manquant.' }),
    };
  }

  let scientificNames;
  try {
    scientificNames = JSON.parse(scientificNamesParam);
    if (!Array.isArray(scientificNames)) {
      throw new Error('Le paramètre scientificNames doit être un tableau JSON.');
    }
  } catch (error) {
    console.error('Erreur de parsing de scientificNames:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Erreur de format pour scientificNames: ${error.message}` }),
    };
  }

  let allResults = [];
  let successCount = 0;
  let failCount = 0;

  for (const name of scientificNames) {
    const gbifApiUrl = `https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(name)}&hasCoordinate=true&limit=1000`; // Limit élevé pour l'exhaustivité
    console.log(`Requête GBIF pour: ${name}`);

    try {
      const response = await fetch(gbifApiUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur GBIF pour ${name}: Statut ${response.status}, Réponse: ${errorText}`);
        failCount++;
        // Continuer même en cas d'erreur pour une espèce, pour ne pas bloquer tout
        continue; 
      }
      const data = await response.json();
      if (data && Array.isArray(data.results)) {
        allResults = allResults.concat(data.results);
        successCount++;
        console.log(`  - ${data.results.length} observations reçues pour ${name}`);
      } else {
        console.warn(`  - Aucune donnée 'results' ou format inattendu pour ${name}`);
        failCount++;
      }
    } catch (error) {
      console.error(`Erreur réseau ou parsing pour ${name}:`, error);
      failCount++;
    }
  }

  console.log(`Requêtes GBIF terminées. Succès: ${successCount}, Échecs: ${failCount}. Total observations agrégées: ${allResults.length}`);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS pour permettre les requêtes depuis votre domaine Netlify
    },
    body: JSON.stringify({ results: allResults }),
  };
};
