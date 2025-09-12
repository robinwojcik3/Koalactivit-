#!/bin/bash

echo "=== Démarrage de Koalactivit ==="
echo

# Vérifier si l'environnement est configuré
if [ ! -d ".venv" ]; then
    echo "L'environnement n'est pas configuré. Lancement du setup..."
    ./setup.sh
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

if [ ! -d "node_modules" ]; then
    echo "Les dépendances Node.js ne sont pas installées. Lancement du setup..."
    ./setup.sh
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

echo "Activation de l'environnement virtuel Python..."
source .venv/bin/activate

echo "Lancement du serveur local..."
npm run dev
