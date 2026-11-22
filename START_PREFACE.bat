@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo PREFACE FITNESS - CLOUDFLARE LOCAL START
echo ================================================
where node >nul 2>nul || (echo Node.js 20+ install karo. & pause & exit /b 1)
if not exist node_modules (echo Installing dependencies... & call npm install || goto :error)
echo Applying local D1 migrations...
call npx wrangler --config cloudflare/wrangler.toml d1 migrations apply preface-fitness --local --force || goto :error
echo Preparing and importing your 14-Nov browser backup...
call node cloudflare/scripts/import-browser-backup-relational.mjs --backup ./preface-fitness-complete-backup-2026-11-14.json --out ./cloudflare/import-output || goto :error
call node cloudflare/scripts/apply-local-import.mjs || goto :error
echo Creating local owner account...
call node cloudflare/scripts/seed-local-owner.mjs || goto :error
call npx wrangler --config cloudflare/wrangler.toml d1 execute preface-fitness --local --file cloudflare/scripts/.seed-owner.sql || goto :error
echo Starting Cloudflare Worker in a new window...
start "Preface Fitness API" cmd /k "cd /d %~dp0 && npx wrangler --config cloudflare/wrangler.toml dev --local --port 8787"
timeout /t 4 /nobreak >nul
echo Starting Preface Fitness website...
start "Preface Fitness Website" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo Website: http://localhost:5173
echo Login: prefacefitness@gmail.com
echo Password: Preface@2026
echo Change this password after first login.
pause
exit /b 0
:error
echo.
echo Setup failed. Copy the error shown above and share it.
pause
exit /b 1
