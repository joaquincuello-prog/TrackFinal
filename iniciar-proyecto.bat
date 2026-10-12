@echo off
title Iniciar TrackFinal - Lácteos San Antonio
echo ===================================================
echo   INICIANDO SISTEMA TRACKFINAL (KIT AVZ-03)
echo ===================================================
echo.
echo 1. Levantando Servidor Backend (Puerto 3000)...
start "TrackFinal - Backend (Puerto 3000)" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

echo 2. Levantando Frontend Vite (Puerto 5173)...
start "TrackFinal - Frontend (Puerto 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo   Servicios iniciados correctamente!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo ===================================================
echo.
pause
