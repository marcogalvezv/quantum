@echo off
cd /d "%~dp0"
echo =========================================================
echo Subiendo Quantum Crew a GitHub (marcogalvezv/quantum)...
echo =========================================================
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/marcogalvezv/quantum.git
git add .
git commit -m "Update Quantum Crew educational multiplayer game" 2>nul
git push -u origin main --force
echo.
echo =========================================================
echo Proceso finalizado. Si se subio con exito, ya puedes
echo conectar el repositorio en https://render.com
echo =========================================================
pause
