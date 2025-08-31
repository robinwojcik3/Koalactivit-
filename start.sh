#!/bin/bash
# Script de démarrage pour Linux/macOS

echo "Installation des dépendances Node.js..."
npm install

if [ -f "FloreApp/requirements.txt" ]; then
    echo "Installation des dépendances Python..."
    pip install -r "FloreApp/requirements.txt"
fi

echo "Démarrage du serveur..."
node local-server.js
