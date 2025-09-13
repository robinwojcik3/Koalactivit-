#!/bin/bash

echo "=== Démarrage de Koalactivit ==="
echo

# Emplacement du script et racine du repo
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."
cd "$REPO_ROOT" || exit 1

# Vérifier si l'environnement est configuré
if [ ! -d ".venv" ]; then
    echo "L'environnement n'est pas configuré. Lancement du setup..."
    "$SCRIPT_DIR/setup.sh" || exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Les dépendances Node.js ne sont pas installées. Lancement du setup..."
    "$SCRIPT_DIR/setup.sh" || exit 1
fi

echo "Activation de l'environnement virtuel Python..."
source .venv/bin/activate

echo "Lancement du serveur local..."
npm run dev
