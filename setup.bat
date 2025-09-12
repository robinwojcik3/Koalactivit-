@echo off
echo === Installation de l'environnement Koalactivit ===
echo.

REM Vérifier Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Python n'est pas installé ou n'est pas dans le PATH
    echo Téléchargez Python depuis: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Vérifier Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installé
    echo Téléchargez Node.js depuis: https://nodejs.org/
    pause
    exit /b 1
)

REM Lancer le script de setup Python
echo Lancement du script de configuration...
python setup.py

if %errorlevel% equ 0 (
    echo.
    echo === Installation terminée avec succès! ===
    echo Pour démarrer l'application, utilisez: start.bat
) else (
    echo.
    echo === Erreur lors de l'installation ===
)

pause