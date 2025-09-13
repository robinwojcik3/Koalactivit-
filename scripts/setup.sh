#!/bin/bash

echo "=== Installation de l'environnement Koalactivit ==="
echo

# Emplacement du script et racine du repo
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "ERREUR: Python3 n'est pas installé"
    echo "Installez Python3 avec votre gestionnaire de paquets"
    exit 1
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "ERREUR: Node.js n'est pas installé"
    echo "Installez Node.js depuis: https://nodejs.org/"
    exit 1
fi

# Lancer le script de setup Python depuis la racine du repo
echo "Lancement du script de configuration..."
(
  cd "$REPO_ROOT" && python3 "${SCRIPT_DIR}/setup.py"
)

if [ $? -eq 0 ]; then
    echo
    echo "=== Installation terminée avec succès! ==="
    echo "Pour démarrer l'application, utilisez: ./scripts/start.sh"
else
    echo
    echo "=== Erreur lors de l'installation ==="
    exit 1
fi
