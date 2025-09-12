#!/bin/bash

echo "=== Installation de l'environnement Koalactivit ==="
echo

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

# Lancer le script de setup Python
echo "Lancement du script de configuration..."
python3 setup.py

if [ $? -eq 0 ]; then
    echo
    echo "=== Installation terminée avec succès! ==="
    echo "Pour démarrer l'application, utilisez: ./start.sh"
else
    echo
    echo "=== Erreur lors de l'installation ==="
    exit 1
fi