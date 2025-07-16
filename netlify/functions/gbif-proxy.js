const fetch = require('node-fetch');

const GBIF_API_BASE = 'https://api.gbif.org/v1';

/**
 * Fonction serverless pour agir comme un proxy vers l'API GBIF.
 * Elle ajoute l'authentification de base requise pour les appels authentifiés.
 */
exports.handler = async (event) => {
  // Récupération des identifiants depuis les variables d'environnement Netlify
  const gbifUser = process.env.GBIF_USER;
  const gbifPassword = process.env.GBIF_PASSWORD; // Votre clé API peut servir de mot de passe

  if (!gbifUser || !gbifPassword) {
    return {
      statusCode: 500,
      body: 'Configuration serveur incomplète: identifiants GBIF manquants.',
    };
  }

  const { scientificName, limit = 200 } = event.queryStringParameters;
  if (!scientificName) {
    return {
      statusCode: 400,
      body: 'Le paramètre "scientificName" est requis.',
    };
  }

  // Construction de l'URL pour la recherche d'occurrences
  const params = new URLSearchParams({
    scientificName,
    hasCoordinate: 'true',
    limit,
  });
  const url = `${GBIF_API_BASE}/occurrence/search?${params.toString()}`;

  // Encodage des identifiants pour l'en-tête d'authentification Basic
  const credentials = Buffer.from(`${gbifUser}:${gbifPassword}`).toString('base64');

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { statusCode: response.status, body: `Erreur de l'API GBIF: ${errorBody}` };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return { statusCode: 500, body: `Erreur interne du proxy: ${error.message}` };
  }
};
