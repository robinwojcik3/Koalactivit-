const fetch = require('node-fetch');

const GBIF_API_BASE = 'https://api.gbif.org/v1';

/**
 * Fonction serverless agissant comme un simple proxy vers l'API GBIF
 * pour contourner les restrictions CORS du navigateur.
 * Aucune authentification n'est requise pour cet endpoint public.
 */
exports.handler = async (event) => {
  // Extraction des paramètres de la requête du client
  const { scientificName, limit = 200 } = event.queryStringParameters;

  if (!scientificName) {
    return {
      statusCode: 400,
      body: 'Le paramètre "scientificName" est requis.',
    };
  }

  // Construction de l'URL pour la recherche d'occurrences publiques
  const params = new URLSearchParams({
    scientificName,
    hasCoordinate: 'true',
    limit,
  });
  const url = `${GBIF_API_BASE}/occurrence/search?${params.toString()}`;

  try {
    // Appel direct à l'API GBIF sans authentification
    const response = await fetch(url);
    const data = await response.text(); // Lire en tant que texte pour transférer la réponse brute

    // Transférer la réponse de GBIF (succès ou erreur) au client
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Erreur interne du proxy: ${error.message}`,
    };
  }
};
