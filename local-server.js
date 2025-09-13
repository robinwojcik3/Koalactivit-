require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // v2
const { Octokit } = require('@octokit/rest');

const app = express();
const PORT = process.env.PORT || 8888;

// In-memory cache
const cache = new Map();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Middlewares
app.use(express.json({ limit: '2mb' }));

// Serve static website
const siteDir = path.join(__dirname, 'site');
app.use(express.static(siteDir));

// Serve hotspots.geojson even if it's not in site/
app.get('/hotspots.geojson', (req, res) => {
  const candidatePaths = [
    path.join(siteDir, 'hotspots.geojson'),
    path.join(__dirname, 'FloreApp', 'hotspots.geojson'),
    path.join(__dirname, 'hotspots.geojson'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }
  return res.status(404).send('hotspots.geojson not found');
});

// ---- Netlify functions locally ----
// GET /.netlify/functions/gbif-proxy
app.get('/.netlify/functions/gbif-proxy', async (req, res) => {
  const scientificNamesParam = req.query.scientificNames;
  if (!scientificNamesParam) {
    return res.status(400).json({ message: 'Le paramètre scientificNames est manquant.' });
  }

  let scientificNames;
  try {
    scientificNames = JSON.parse(scientificNamesParam);
    if (!Array.isArray(scientificNames)) {
      throw new Error('Le paramètre scientificNames doit être un tableau JSON.');
    }
  } catch (error) {
    console.error('Erreur de parsing de scientificNames:', error);
    return res.status(400).json({ message: `Erreur de format pour scientificNames: ${error.message}` });
  }

  let allResults = [];
  let successCount = 0;
  let failCount = 0;
  let cacheHitCount = 0;

  try {
    const resultsPerSpecies = await Promise.all(
      scientificNames.map(async (name) => {
        const cachedEntry = cache.get(name);
        if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS)) {
          cacheHitCount++;
          successCount++;
          return cachedEntry.data;
        }

        const gbifApiUrl = `https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(name)}&hasCoordinate=true&limit=1000`;
        try {
          const response = await fetch(gbifApiUrl);
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erreur GBIF pour ${name}: Statut ${response.status}, Réponse: ${errorText}`);
            failCount++;
            return null;
          }
          const data = await response.json();
          if (data && Array.isArray(data.results)) {
            cache.set(name, { data: data.results, timestamp: Date.now() });
            successCount++;
            return data.results;
          } else {
            failCount++;
            return null;
          }
        } catch (e) {
          console.error(`Erreur réseau ou parsing pour ${name}:`, e);
          failCount++;
          return null;
        }
      })
    );

    resultsPerSpecies.forEach((results) => {
      if (results) allResults = allResults.concat(results);
    });

    console.log(`Requêtes GBIF terminées. Succès: ${successCount}, Échecs: ${failCount}, Cache hits: ${cacheHitCount}. Total: ${allResults.length}`);
    return res.status(200).json({ results: allResults });
  } catch (e) {
    console.error('Erreur interne gbif-proxy:', e);
    return res.status(500).json({ message: e.message });
  }
});

// POST /.netlify/functions/save-route
app.post('/.netlify/functions/save-route', async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  let filePath = process.env.FILE_PATH;

  if (!filePath) {
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-');
    filePath = `itineraries/route-${ts}.geojson`;
  }

  if (!token || !owner || !repo) {
    return res.status(500).send('Missing GitHub configuration');
  }

  try {
    const octokit = new Octokit({ auth: token });
    const content = Buffer.from(JSON.stringify(req.body)).toString('base64');

    // Try to get current file SHA if exists
    let sha;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
      sha = data.sha;
    } catch (e) {
      sha = undefined; // file not found => create
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Add route ${filePath}`,
      content,
      sha,
    });

    return res.status(200).send('Saved');
  } catch (e) {
    console.error('save-route error:', e);
    return res.status(500).send(e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Local server running at http://localhost:${PORT}`);
  console.log('Serving static files from /site and emulating Netlify functions.');
});