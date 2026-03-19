@echo off
TITLE Secure Media Gateway - Frontend + Backend
SETLOCAL

:: --- CHECK FOR NODE_MODULES ---
if not exist "node_modules" (
    echo [ERROR] Frontend node_modules not found. Please run 'npm install' in the root directory.
    pause
    exit /b
)
if not exist "backend\node_modules" (
    echo [ERROR] Backend node_modules not found. Please run 'npm install' in the /backend directory.
    pause
    exit /b
)

:: --- KILL EXISTING PORTS (PORT 5000) ---
echo [*] Clearing ghost processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a 2>nul

:: --- START BACKEND ---
echo [*] Starting Backend (Port 5000)...
cd backend
:: 'start /B' runs it in the same window (backgrounded)
start /B "" node server.js
cd ..

:: --- START FRONTEND ---
echo [*] Starting Frontend (Vite)...
echo [TIP] Press Ctrl+C or close this window to stop both.
:: Running in foreground so closing window kills both
npm run dev

:: Cleanup is automatic when the command prompt window is closed.
ENDLOCAL
