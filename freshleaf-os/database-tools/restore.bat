@echo off
setlocal DisableDelayedExpansion
where node.exe >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Can cai Node.js 22+ va chay npm install tai thu muc goc du an.
  exit /b 1
)
node "%~dp0database-tools.mjs" restore
exit /b %errorlevel%
