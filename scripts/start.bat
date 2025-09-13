@echo off
setlocal enabledelayedexpansion
echo === Démarrage de Koalactivit ===
echo.

REM Répertoires
set SCRIPT_DIR=%~dp0
set REPO_ROOT=%SCRIPT_DIR%..
pushd "%REPO_ROOT%" >nul

REM Vérifier si l'environnement est configuré
if not exist ".venv" (
    echo L'environnement n'est pas configure. Lancement du setup...
    call "%SCRIPT_DIR%setup.bat"
    if %errorlevel% neq 0 (popd & exit /b 1)
)

if not exist "node_modules" (
    echo Les dependances Node.js ne sont pas installees. Lancement du setup...
    call "%SCRIPT_DIR%setup.bat"
    if %errorlevel% neq 0 (popd & exit /b 1)
)

echo Activation de l'environnement virtuel Python...
call .venv\Scripts\activate

echo Lancement du serveur local...
npm run dev

popd >nul
pause
