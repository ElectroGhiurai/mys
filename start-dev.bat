@echo off
echo ===================================================
echo Starting MYS Calorie Tracker Dev Servers...
echo ===================================================

echo Starting Spring Boot backend...
start "MYS Backend Server" cmd /k "cd backend\mys && mvn spring-boot:run"

echo Starting Vite frontend...
start "MYS Frontend Server" cmd /k "cd frontend && npm run dev"

echo ===================================================
echo Done! Backend and Frontend are booting in separate windows.
echo ===================================================
