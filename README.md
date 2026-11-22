# Preface Fitness — Cloudflare-only local project

This package removes the Supabase SDK and Supabase runtime configuration from the frontend. The existing React application uses the Cloudflare Worker API and a local Cloudflare D1 database through Wrangler.

## Fast start on Windows

1. Extract this ZIP.
2. Open the extracted folder in VS Code.
3. Double-click `START_PREFACE.bat`.
4. The script installs npm dependencies, applies local D1 migrations, imports the included browser backup, creates a local owner account, starts the Worker and Vite, and opens `http://localhost:5173`.

Local login:
- Email: `prefacefitness@gmail.com`
- Password: `Preface@2026`

Change the temporary password after first login.

## Data snapshot included

The included backup is from 2026-11-14, not a live 2026-11-22 database export. The import includes 129 members, 123 payments, 4 membership plans, 5 trainers, 1 PT session, 7 workout plans, 4 diet plans, 22 settings, and 10 website enquiries. It does not include Supabase auth identities, member portal PIN hashes, feedback rows absent from the browser backup, or the 22-Nov live changes.

## Important deployment note

This is a local development handover. It does not delete or alter the old hosted database. Public production deployment still needs a Cloudflare account, a remote D1 database, a deployed Worker URL, and production CORS configuration. Keep the old service intact until the local app is verified and the final live data snapshot is imported.
