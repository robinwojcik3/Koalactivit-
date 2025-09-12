@echo off
echo === Démarrage de Koalactivit ===
echo.

REM Vérifier si l'environnement est configuré
if not exist ".venv" (
    echo L'environnement n'est pas configuré. Lancement du setup...
    call setup.bat
    if %errorlevel% neq 0 exit /b 1
)

if not exist "node_modules" (
    echo Les dépendances Node.js ne sont pas installées. Lancement du setup...
    call setup.bat
    if %errorlevel% neq 0 exit /b 1
)

echo Activation de l'environnement virtuel Python...
call .venv\Scripts\activate

echo Lancement du serveur local...
npm run dev

pause
