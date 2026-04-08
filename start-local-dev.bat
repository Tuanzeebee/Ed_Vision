@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo [1/2] Starting LiveKit + Backend...
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start-local-livekit-backend.ps1"
if errorlevel 1 (
  echo.
  echo [ERROR] Failed to start LiveKit + Backend.
  echo [INFO]  Check logs in tools\runtime\
  pause
  exit /b 1
)

echo.
echo [2/2] Starting Frontend in a new terminal...
start "EdVision Frontend" powershell -NoExit -NoProfile -ExecutionPolicy Bypass -Command "Set-Location '%~dp0Ed_Vision'; npm run dev"

echo.
echo [DONE] Local development stack is launching.
echo        Backend : http://localhost:3000
echo        LiveKit : ws://localhost:7880
echo        Frontend: http://localhost:5173

exit /b 0