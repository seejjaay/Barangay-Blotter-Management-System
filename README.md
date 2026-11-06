# Digital Barangay Blotter Management System

A web platform for the barangay officials of **Barangay Banay-Banay 2nd, San Jose, Batangas**. It replaces the paper blotter logbook with a central digital record, and adds analytics to help officials make decisions.

## Features

- **Blotter records** – create, edit, search and print incident records, with a timeline per case.
- **Document generators** – summons, settlement agreements and blotter extracts.
- **Duplicate detection** – Levenshtein distance (a measure of how many single-character edits turn one string into another) flags near-identical reports when a new blotter is filed.
- **Geospatial clustering** – DBSCAN (density-based clustering that groups nearby points and treats isolated ones as noise) builds a heatmap of high-density incident zones, with a risk level per cluster. See [lib/dbscan.ts](lib/dbscan.ts).
- **Trend analytics** – monthly trends by category, average resolution time, resolution status breakdown, location correlation, and a DILG report dialog.
- **Citizen profiles** – incident history grouped per person.
- **Audit log** – logins, record changes, exports and user changes are recorded.
- **Role-based access** – `Brgy. Captain`, `Secretary`, `Desk Officer`. Only Captain and Secretary can open `/audit` and `/users` (enforced in [middleware.ts](middleware.ts)).
- **Session timeout** for idle users.

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| UI | Tailwind CSS 4, Radix UI / shadcn components, Recharts, Leaflet / react-leaflet |
| Backend | Supabase (Postgres, Auth, Row Level Security) via `@supabase/ssr` |
| Geocoding | OpenStreetMap Nominatim (no key needed, limited to 1 request/second) |

## Getting started

### Prerequisites

- Node.js 20+ (developed on Node 24) and npm
- A Supabase project (free tier is fine) – <https://supabase.com>

### 1. Install

```bash
npm install
```

### 2. Environment variables

Create `.env.local` in the project root (it is git-ignored):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Find these in Supabase under **Project Settings → API**.

- `SUPABASE_SERVICE_ROLE_KEY` is used server-side only, by the signup action that creates users ([lib/auth-actions.ts](lib/auth-actions.ts)). It bypasses RLS, so never prefix it with `NEXT_PUBLIC_` and never commit it.
- If the two `NEXT_PUBLIC_` values are missing, `/login` and `/signup` still render, but every authenticated page returns a 500 (`supabaseUrl is required`).

### 3. Database

Open the Supabase **SQL Editor**, paste the contents of [supabase-schema.sql](supabase-schema.sql) and run it once. It creates `profiles`, `blotter_records` and `audit_logs`, with Row Level Security and policies for signed-in users.

Notes:

- The schema was reconstructed from what the app code reads and writes, since the original file was out of sync with the code. If something errors on a missing column, that's the first place to look.
- Failed-login audit entries are written before the user is authenticated, so the `authenticated`-only insert policy blocks them. This is deliberate: opening that insert to anonymous users would let anyone spam the audit log.
- The "resolution duration" chart on `/analysis` currently shows a **simulated** trend (see [lib/analytics-queries.ts](lib/analytics-queries.ts)), not real data. The dashboard KPI uses `updated_at - created_at` for resolved records.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>. If port 3000 is busy, run `npx next dev -p 3100`.

### 5. Create the first user

1. Go to `/signup` and enter name, email and password. **Public signup only works while the database has no users**: the first account automatically becomes the Brgy. Captain, and after that `/signup` is closed.
2. Sign in at `/login` (no confirmation email is needed).
3. Add everyone else from **Users** in the sidebar (Captain or Secretary only). User-management actions check the caller's role on the server.

## Pages

| Route | Purpose | Access |
|---|---|---|
| `/login`, `/signup` | Auth | Public |
| `/` | Dashboard: KPIs, charts, recent incidents, notifications | Signed in |
| `/incidents`, `/incidents/[id]` | Blotter list, detail, timeline, documents | Signed in |
| `/citizens`, `/citizens/[id]` | Per-person incident history | Signed in |
| `/heatmap` | DBSCAN hotspot map | Signed in |
| `/analysis` | Trend and resolution analytics | Signed in |
| `/audit` | Audit log | Captain, Secretary |
| `/users` | User management | Captain, Secretary |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Project layout

```
app/          Routes (App Router pages)
components/   dashboard, incidents, heatmap, analytics, audit, users, auth, ui (shadcn)
lib/          Supabase clients, auth actions, audit helper, DBSCAN, geocoding, analytics queries
middleware.ts Session refresh, login redirect, role-based route protection
supabase-schema.sql  Database schema, run once in the Supabase SQL Editor
```

## Notes

- Next.js 16 warns that the `middleware` file convention is deprecated in favour of `proxy`. It still works; renaming is a future cleanup.
- This repo uses npm (`package-lock.json`). `pnpm-lock.yaml` is no longer tracked.
