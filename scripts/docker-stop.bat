@echo off
echo === Arret de Koalactivit Docker ===
echo.

docker-compose -f docker\docker-compose.yml down

echo.
echo Application arretee.
pause
