@echo off
REM Script de démarrage pour Windows

echo Installation des dépendances Node.js...
call npm install

if exist "FloreApp\requirements.txt" (
    echo Installation des dépendances Python...
    pip install -r "FloreApp\requirements.txt"
)

echo Démarrage du serveur...
node local-server.js
