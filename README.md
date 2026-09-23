# Preface Fitness — Phase 1

A React + Vite gym management web app branded for **Preface Fitness**.

## Phase 1 deployment model

This build is intentionally **serverless** so it can be deployed directly to GitHub Pages and still be usable:

- Member database (CRUD-lite: add, search, check-in, delete)
- Leads / enquiries with stage updates
- Membership tracking
- Attendance
- Payments with local records and deletion
- Communication composer and message previews
- Reports
- Settings
- JSON backup / restore
- Local IndexedDB persistence

### Important limitation

GitHub Pages is static hosting. IndexedDB gives each browser/device its own local database. It is **not a shared cloud database** between computers or staff members. The backup/restore feature is included so the gym can move data manually during Phase 1.

WhatsApp/SMS/email bulk sending requires a backend/provider integration. The UI is ready for that integration; do not put provider API secrets in this React app.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The exact Preface Fitness logo supplied for the project is stored at `public/preface-logo.png` and is not AI-generated.

## Production upgrade path

Keep the React UI and replace the local data layer with:

`React → authenticated API → PostgreSQL/Supabase`

Then add WhatsApp/SMS/email provider integrations, multi-user roles, scheduled automations, and shared cloud data.
