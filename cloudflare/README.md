# Cloudflare backend

- `worker/index.js`: Cloudflare Worker API.
- `migrations/`: D1 schema migrations.
- `scripts/import-browser-backup-relational.mjs`: converts the included browser backup into relational D1 import batches.
- `scripts/seed-local-owner.mjs`: creates a local-only owner login for first start.
- `scripts/apply-local-import.mjs`: applies generated import batches to local D1.

The root `START_PREFACE.bat` runs these steps and launches Wrangler + Vite locally.
