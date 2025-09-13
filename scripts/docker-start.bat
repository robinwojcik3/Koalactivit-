@echo off
echo === Lancement de Koalactivit avec Docker ===
echo.

REM Verifier si Docker Desktop est en cours d'execution
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Desktop n'est pas demarre.
    echo Demarrage de Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Attente du demarrage de Docker (cela peut prendre quelques instants)...
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker version >nul 2>&1
    if %errorlevel% neq 0 goto wait_docker
    
    echo Docker est maintenant pret!
    echo.
)

echo Construction de l'image Docker...
docker-compose -f docker\docker-compose.yml build

if %errorlevel% neq 0 (
    echo.
    echo ERREUR lors de la construction de l'image.
    pause
    exit /b 1
)

echo.
echo Lancement de l'application...
docker-compose -f docker\docker-compose.yml up

pause
