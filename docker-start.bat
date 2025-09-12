@echo off
echo === Lancement de Koalactivit avec Docker ===
echo.

REM Vérifier si Docker Desktop est en cours d'exécution
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Desktop n'est pas démarré.
    echo Démarrage de Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Attente du démarrage de Docker (cela peut prendre quelques instants)...
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker version >nul 2>&1
    if %errorlevel% neq 0 goto wait_docker
    
    echo Docker est maintenant prêt!
    echo.
)

echo Construction de l'image Docker...
docker-compose build

if %errorlevel% neq 0 (
    echo.
    echo ERREUR lors de la construction de l'image.
    pause
    exit /b 1
)

echo.
echo Lancement de l'application...
docker-compose up

pause