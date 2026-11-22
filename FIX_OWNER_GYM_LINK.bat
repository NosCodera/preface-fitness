@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo PREFACE FITNESS - REPAIR LOCAL OWNER GYM LINK
echo ================================================
if not exist "cloudflare\wrangler.toml" (
  echo ERROR: Copy this BAT and SQL file into the project root, beside package.json.
  pause
  exit /b 1
)
if not exist "node_modules\wrangler" (
  echo ERROR: Wrangler dependencies not found. Open VS Code terminal in project root and run npm install first.
  pause
  exit /b 1
)
echo Repairing owner-to-gym mapping in LOCAL D1 only...
call npx wrangler --config cloudflare/wrangler.toml d1 execute preface-fitness --local --file="repair-owner-gym-link.sql"
if errorlevel 1 (
  echo.
  echo Repair failed. No business records were intentionally changed.
  pause
  exit /b 1
)
echo.
echo Repair command completed. Restart npm run dev, then sign out and sign in again.
echo Expected: owner account linked to the existing imported gym.
pause
