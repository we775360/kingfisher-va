# Kingfisher Virtual Airlines - Project Memory

## Overview
Full-stack virtual airline (VA) platform for flight simulation. Two packages in pnpm monorepo:
- **api/** — Fastify backend (PostgreSQL + Prisma + Discord bot)
- **web/** — React 19 SPA (pilot dashboard, public site)

> **Note:** The custom Electron ACARS client (`acars/`) has been **deleted and replaced** with **FSACARS** — a mature, Windows-based flight tracking client that pilots download and run on their machines. The API now exposes FSACARS-compatible endpoints.

## Current State (Updated 2026-06-28)

### ✅ COMPLETED — Partnerships, Liveries & Text Polish (Session 6)

#### 1. Partnerships Section
- Added "Our Partners" section below Meet the Founder with 3 cards: FSACARS (Active), IVAO (Upcoming), VATSIM (Upcoming)
- Each card has an icon, description, and status badge

#### 2. Liveries Section
- Added "Official Liveries" section with 3 aircraft cards: A320, A321, A380
- Each card lists compatible simulators: MSFS 2020, MSFS 2024, X-Plane 12, P3D v5+
- Download button per livery (placeholder — real links TBD)

#### 3. CTA Text Updates
- "Join as Staff" → "Join as ATC Staff" (hero CTA, mobile nav)
- "Staff" → "ATC Staff" (desktop nav)
- "Staff Login" → "ATC Staff Login" (Realistic Ops dual-CTA card)
- `serverpass` blanked out in AGENTS.md org.cfg example

---

### ✅ COMPLETED — SEO, Landing Reorder & FSACARS Polish (Session 5)

#### 1. Landing Page Reorder
- Moved Realistic Flight Operations section to immediately after hero (was buried below 3D Network / Live Map)
- Changed "Explore Network" button in hero to scroll to `#network` (3D globe section)
- Added "Join as ATC Staff" green CTA button in hero section (links to `/atc/login`)
- Added "Realistic Ops" to desktop & mobile nav links
- Added "ATC Staff" button in desktop nav and "Join as ATC Staff" in mobile nav

#### 2. SEO
- Added `/robots.txt` and `/sitemap.xml` dynamic routes in `api/src/index.ts`
- Sitemap covers all 11 static pages with weekly changefreq
- Landing page: canonical URL, richer description/keywords, `og:type`, `twitter:card`, and JSON-LD (`@type: Airline`)

#### 3. FSACARS Page Polish
- Removed `useState` import (no longer used)
- Removed entire org.cfg code block and `copyOrgCfg` handler
- Page now only shows: download button, 4-step quick start, "How It Works" flow, credentials info, and important notes

---

### ✅ COMPLETED — FSACARS Migration (Session 4)

#### 1. Deleted Custom ACARS (`acars/`)
- Entire `acars/` directory removed from the repository
- Removed from `pnpm-workspace.yaml` (monorepo reduced to 2 packages: api, web)
- Removed `electron`, `node-simconnect`, `node-fsuipc` build dependencies

#### 2. FSACARS Server Endpoints (Node.js)
Created 4 endpoints in the existing Fastify API that speak the FSACARS protocol:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/fsacars/userquery` | GET/POST | Validates pilot credentials (callsign/email + password). Returns `USEROK` or `NOUSR` |
| `/api/v1/fsacars/dispatch` | GET/POST | Returns pilot's active booking as `ORIG\|DEST\|MESSAGE\|FLIGHTNUM\|RESERVED\|` |
| `/api/v1/fsacars/posrep` | POST | Receives position updates (lat/lon/alt/GS/heading). Upserts LiveFlight, creates Telemetry, emits to SSE bus |
| `/api/v1/fsacars/pirep` | POST | Receives full PIREP data from FSACARS. Creates PIREP record, updates pilot stats, sends Discord notification, deletes LiveFlight |

**Files created:**
- `api/src/controllers/fsacars.controller.ts` — All 4 handlers
- `api/src/routes/fsacars.routes.ts` — Route registration

**Files modified:**
- `api/src/index.ts` — Registered `fsacarsRoutes` at `/api/v1/fsacars/*`
- `api/package.json` — Added `@fastify/formbody` for form-urlencoded parsing
- `api/.env.example` — Added `FSACARS_SERVER_PASS` env var

#### 3. FSACARS Protocol (how it works)
- Pilots download the FSACARS v4.2.5+ Windows client from fsacars.com
- Pilots configure `org.cfg` with our API endpoints (hashalgo=HTTPS for plain-text password over TLS)
- FSACARS sends `user` (callsign/email) + `pass` (password) to userquery → our endpoint bcrypt-validates against the User table
- Once verified, FSACARS talks to dispatch → posrep (every ~10s) → pirep (on Stop)
- Position data feeds into the existing SSE live map (`/public/live-flights/stream`)
- PIREPs are stored in the same database table, viewable via existing web pages

#### 4. Web Frontend Updates
- **New page:** `/fsacars` — FSACARS download & setup guide with:
  - Download link to fsacars.com
  - 4-step setup instructions
  - Pre-filled org.cfg (copy to clipboard)
  - Login credentials info (use callsign + website password)
  - Important notes section
- **Dashboard:** ACARS section replaced with FSACARS card linking to `/fsacars`
- **Footer:** Updated from "ACARS Engine" to "FSACARS Powered"
- **Flights page:** Info box links to FSACARS setup page
- **Handbook:** ACARS references → FSACARS
- **Privacy Policy:** ACARS → FSACARS
- **Events page:** ACARS → FSACARS

**Files created:**
- `web/src/pages/FSACARS.tsx` — Setup guide page

**Files modified:**
- `web/src/App.tsx` — Added `/fsacars` route
- `web/src/pages/Dashboard.tsx` — ACARS → FSACARS card + footer
- `web/src/pages/Flights.tsx` — Info box links to FSACARS
- `web/src/pages/Handbook.tsx` — ACARS → FSACARS
- `web/src/pages/PrivacyPolicy.tsx` — ACARS → FSACARS
- `web/src/pages/Events.tsx` — ACARS → FSACARS

#### 5. org.cfg (for pilot distribution)
```
orgname=Kingfisher Virtual Airlines
orgurl=https://kingfisherva.com
orglogo=logo.png
orglicense=none
hashalgo=HTTPS
userquery=https://kingfisher-api.onrender.com/api/v1/fsacars/userquery
pirep=https://kingfisher-api.onrender.com/api/v1/fsacars/pirep
posrep=https://kingfisher-api.onrender.com/api/v1/fsacars/posrep
dispatch=https://kingfisher-api.onrender.com/api/v1/fsacars/dispatch
serverpass=
```

### ✅ COMPLETED — Previous Sessions

#### SSE Real-time Telemetry
- `api/src/utils/position-bus.ts` — EventEmitter singleton
- FSACARS posrep endpoint now broadcasts to SSE bus (same as old ACARS)
- SSE endpoint: `GET /api/v1/public/live-flights/stream`
- Web LiveMap uses SSE for real-time aircraft position updates

#### Realistic Flight Operations (ATC System)
- Full ATC staff scheduling system with auto-flight generation
- 5 ATC positions: DEL, GND, TWR, APR, CTR
- Auto-generates 3-6 realistic flights when all positions filled for a time slot
- Pilot booking + ATC confirmation flow with wallet rewards
- See ATC section below for full details

### ✅ COMPLETED — SimBrief Integration & IVAO Filing (Session 7)

#### What was done
- Custom OFP generator removed (too complex for accurate results without real AIRAC data)
- **SimBrief prefill button** added to booking detail page — opens SimBrief dispatch with all fields pre-filled (dep, arr, flight number, aircraft, registration)
- **IVAO filing note** added — shows `RMK IVAOKFR` remark code for IVAO flight plan filing
- Live METAR display remains in sidebar

#### Web Frontend
- **BookingInfo.tsx** (`/booking/:type/:id`) — "Flight Plan & Filing" section with:
  - "Generate on SimBrief" button → opens SimBrief prefill page with booking data
  - IVAO remark code `RMK IVAOKFR` for flight plan filing

### Remaining
1. Test FSACARS endpoints with actual FSACARS client
2. Consider adding a route string field to bookings so SimBrief prefill is even richer

---
## Realistic Flight Operations (ATC System)

### How It Works (Data Flow)
1. **Admin** sets a daily hub (dep/arr airports + date) via Admin → Daily Hubs
2. **Admin** creates ATC staff accounts via Admin → ATC Staff
3. **ATC Staff** logs in at `/atc/login` (separate auth from pilots)
4. **ATC Staff** books schedules (day + position + time slot) in ATC Dashboard
5. When all 5 positions filled for a time slot → auto-generates 3-6 realistic flights
6. **Pilots** browse available flights at `/realistic-flights` and book
7. **Pilots** fly on VATSIM/IVAO during the scheduled time
8. **ATC Staff** ticks flights as confirmed (dep + arr) in Flights tab
9. Both dep & arr confirmed → pilot's wallet credited automatically

---
## Commands
- `pnpm install` (root)
- API dev: `cd api && pnpm dev`
- Web dev: `cd web && pnpm dev`
- DB: `cd api && pnpm db:push` (push schema), `pnpm db:studio` (Prisma Studio)
- Lint: `cd api && pnpm lint`, `cd web && pnpm lint`
