@echo off
setlocal
if "%1"=="" (
  set PORT=3000
) else (
  set PORT=%1
)
cd /d "%~dp0"
echo Starting AgroInsight backend on port %PORT%
set PORT=%PORT%
node server.js
endlocal
