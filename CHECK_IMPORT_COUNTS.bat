@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if not exist "cloudflare\wrangler.toml" (
  echo ERROR: Is file ko project ROOT folder D:\preface_fix mein rakho.
  echo Yahan cloudflare\wrangler.toml nahi mili: %CD%
  pause
  exit /b 1
)
echo PREFACE FITNESS - LOCAL D1 IMPORT COUNTS
echo ========================================
for %%T in (gyms membership_plans members trainers payments pt_sessions workout_plans diet_plans leads app_settings feedbacks attendance) do (
  echo.
  echo ===== %%T =====
  call npx wrangler --config cloudflare/wrangler.toml d1 execute preface-fitness --local --command "SELECT COUNT(*) AS total FROM %%T;"
  if errorlevel 1 (
    echo ERROR checking %%T
    pause
    exit /b 1
  )
)
echo.
echo Count check complete.
echo Please send screenshot of all counts above.
pause
