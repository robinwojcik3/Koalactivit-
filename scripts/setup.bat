@echo off
setlocal
echo === Installation de l'environnement Koalactivit ===
echo.

set SCRIPT_DIR=%~dp0
set REPO_ROOT=%SCRIPT_DIR%..

REM Vérifier Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Python n'est pas installe ou n'est pas dans le PATH
    echo Telechargez Python depuis: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Vérifier Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe
    echo Telechargez Node.js depuis: https://nodejs.org/
    pause
    exit /b 1
)

REM Lancer le script de setup Python depuis la racine du repo
echo Lancement du script de configuration...
pushd "%REPO_ROOT%" >nul
python "%SCRIPT_DIR%setup.py"
set ERR=%errorlevel%
popd >nul

if %ERR% equ 0 (
    echo.
    echo === Installation terminee avec succes! ===
    echo Pour demarrer l'application, utilisez: scripts\start.bat
) else (
    echo.
    echo === Erreur lors de l'installation ===
)

pause
