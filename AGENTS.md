# Kingfisher Virtual Airlines - Project Memory

## Overview
Full-stack virtual airline (VA) platform for flight simulation. Three packages in pnpm monorepo:
- **api/** — Fastify backend (PostgreSQL + Prisma + Discord bot)
- **web/** — React 19 SPA (pilot dashboard, public site)
- **acars/** — Electron ACARS client (real-time flight tracking)

## Current State (Updated 2026-06-26)

### ✅ COMPLETED — ACARS Rebuild (Steps 1-6)

#### 1. Simulator Abstraction Layer
- Created `acars/electron/sim-bridge/` with pluggable adapter architecture
- **SimConnectAdapter** — MSFS2020/MSFS2024/FSX/P3D via `node-simconnect`
- **FSUIPCAdapter** — FSX/P3D alternative via `node-fsuipc`
- **XPUIPCAdapter** — X-Plane 11/12 via UDP protocol
- Auto-detection via process scanning (`detectSimulatorsRunning()`, `detectBestSimulator()`)
- `SimulatorBridge` facade with `getBridge()` singleton
- Fallback chain: tries target sim → all others → UNKNOWN
- IPC handlers: `sim:connect`, `sim:disconnect`, `sim:get-status`, `sim:detect`, `sim:get-detected`

#### 2. ACARS Component Split
- Monolithic 974-line `App.tsx` → clean architecture with 9 component files
- **LoginScreen.tsx** — email/password auth
- **Sidebar.tsx** — navigation with 6 tabs (Live, Tasks, EFB, Map, Audio, Data)
- **Dashboard.tsx** — telemetry, flight profile, phase display, controls
- **FlightTracker.tsx** — start/end flight controls
- **PIREPModal.tsx** — auto-submit confirmation with flight metrics
- **MapView.tsx** — Leaflet map with aircraft tracking & flight path
- **BookingsView.tsx** — upcoming bookings with SimBrief dispatch
- **Settings.tsx** — toggles for auto-announcements, ambient sounds, volume
- **AudioEngine.tsx** — visual panel showing phase-based announcements
- **EFBPanel.tsx** — 5-tab EFB (Briefing, Weather, Fuel, Weights, Charts)

#### 3. State Management (Zustand)
- **authStore.ts** — User/pilot auth, token persistence, `checkAuth()` on mount
- **flightStore.ts** — OFP, flight data, tracking, phase detection, PIREP submission
- **settingsStore.ts** — announcements toggle, volume, theme (persisted)

#### 4. Library Modules
- **lib/api.ts** — Axios client with env-configurable base URL (`VITE_API_URL`), JWT interceptor, all API functions
- **lib/audio-manager.ts** — AudioManager class using Web Audio API
- **lib/utils.ts** — `cn()` helper (clsx + tailwind-merge)
- **hooks/useSimulator.ts** — React bindings for electronAPI sim bridge
- **hooks/useAudio.ts** — Auto-announcement playback triggered by phase changes

#### 5. Audio / Announcement System
- Directory: `acars/public/audio/announcements/` (add .mp3 files there)
- Phase-based auto-play: boarding, pushback, takeoff, 10k ft, cruise, descent, approach, landing, taxi-in
- Web Audio API for playback (no external audio lib needed)
- Volume control + enable/disable toggle in Settings
- Audio engine panel showing current phase & next announcement

#### 6. EFB Panel
- 5 tabs: Briefing, Weather, METAR (fetched from metar.glassey.cloud), Fuel Plan, Weights & Balance, Charts (placeholder)
- Fuel breakdown: Trip/Reserve/Alternate/Taxi/Extra with visual bars
- Real-time fuel burn rate display when tracking

#### 7. Auto PIREP
- `endFlightAndSubmitPIREP()` in flightStore
- Auto-calculates: flight time, fuel used, landing rate, phase log count
- PIREPModal shows summary → pilot confirms → auto-submits to API
- Resets flight state on completion

#### 8. Dashboard & Flight Flow
- Login → sees bookings → selects mission → SimBrief fetch → Start Flight
- Live telemetry on dashboard (alt, GS, heading, squawk, VS, fuel)
- Phase auto-detection from sim data (Pre-flight → Taxi → Takeoff → Climb → Cruise → Descent → Approach → Final → Landed → Taxi-in → Arrived)
- Flight log with timestamps
- "Reset Systems" to clear OFP and start fresh

### 🔴 REMAINING / NOT STARTED

#### 9. WebSocket/SSE for Real-time Telemetry
- Currently polling every 10s
- Should upgrade to WebSocket or SSE for instant position updates on web LiveMap

#### 10. Polish & Quality
- ✅ Fixed hardcoded API URLs in web pages (Landing, Dashboard, LiveMap, Admin)
- ✅ Created `.env.example` files for all 3 packages
- ❌ No test files anywhere
- ❌ Web `App.css` uses deprecated Vite patterns (check)
- ❌ ACARS window was 450x800 → now 1280x800 (wider for improved layout)
- ❌ Need to verify `pnpm-workspace.yaml` has `node-fsuipc` available

### ACARS Directory Structure (Current)
```
acars/
├── electron/
│   ├── main.ts              # Updated: sim-bridge integration
│   ├── preload.ts           # Updated: exposes sim APIs + electronAPI
│   ├── electron-env.d.ts    # Updated: Window.electronAPI types
│   └── sim-bridge/
│       ├── types.ts         # SimData, SimulatorType, SimulatorAdapter
│       ├── detector.ts      # Process-based sim detection
│       ├── index.ts         # SimulatorBridge facade + singleton
│       └── adapters/
│           ├── simconnect.ts # MSFS/FSX/P3D via node-simconnect
│           ├── fsuipc.ts     # FSX/P3D via node-fsuipc
│           └── xpuipc.ts     # X-Plane via UDP
├── public/
│   └── audio/
│       └── announcements/   # ← ADD YOUR .mp3 FILES HERE
├── src/
│   ├── main.tsx
│   ├── App.tsx              # Clean routing, auth check, header/footer
│   ├── App.css              # Custom scrollbar styles
│   ├── components/
│   │   ├── LoginScreen.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── EFBPanel.tsx     # 5-tab EFB
│   │   ├── MapView.tsx
│   │   ├── BookingsView.tsx
│   │   ├── FlightTracker.tsx
│   │   ├── AudioEngine.tsx  # Announcements panel
│   │   ├── PIREPModal.tsx
│   │   └── Settings.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── flightStore.ts
│   │   └── settingsStore.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── audio-manager.ts
│   │   └── utils.ts
│   └── hooks/
│       ├── useSimulator.ts
│       └── useAudio.ts
```

### ✅ COMPLETED — Session 2 (UI Redesign + SSE + Polish)

#### 9. Real-time Telemetry (SSE)
- Created `api/src/utils/position-bus.ts` — EventEmitter singleton
- ACARS position endpoint (`POST /api/v1/acars/position`) now broadcasts to SSE bus
- New SSE endpoint: `GET /api/v1/public/live-flights/stream`
- Web LiveMap uses SSE instead of polling (real-time aircraft position updates)

#### 10. API Bugfixes
- PIREP controller now looks up aircraft by ID → registration → ICAO type fallback
- Position update schema expanded to include fuel, VS, phase
- ACARS flight store now calls `sendPositionUpdate()` every 10s while tracking

#### 11. ACARS Professional UI Redesign
- Complete visual overhaul with glass-morphism panels, monospace telemetry
- **Header**: Compact with phase pipeline dots, flight info, pilot badge
- **Dashboard**: Large telemetry cards (ALT, GS, HDG, VS) + mini cards (IAS, MACH, PITCH, BANK, SQUAWK) + fuel panel + flight log + controls
- **Sidebar**: Sleeker, narrower, refined icons
- **All components**: Cleaner typography, better spacing, consistent glass style
- Added JetBrains Mono font for all numerical data
- Phase pipeline progress indicator in header

### ✅ COMPLETED — Session 3 (Simulator Bridge Fix + Demo Mode + Live Tracking)

#### 12. DemoAdapter — Simulator-Free Flight Simulation
- Created `acars/electron/sim-bridge/adapters/demo.ts` with full flight lifecycle simulation
- Simulates: Ground → Taxi → Takeoff → Climb → Cruise → Descent → Approach → Landed → Arrived
- Generates realistic telemetry: alt, GS, IAS, Mach, VS, heading, pitch, bank, fuel, fuel flow, squawk
- Great-circle route tracking between origin/destination airports
- Gaussian noise on all values for realism
- Auto-connects on Linux (where native sim SDKs are unavailable); on Windows, fallback when no sim detected

#### 13. SimulatorBridge Auto-Fallback Chain
- Bridge now tries: target sim → all native adapters → DemoAdapter (always works)
- New IPC handler: `sim:connect-demo` with optional origin/dest coords
- `setDemoRoute()` to pre-configure demo route from OFP/booking data
- Status now reports `demo: true` so UI can show "SIMULATION" badge

#### 14. Fixed Booking → Mission Loading Flow
- `BookingsView.tsx` — "Load Mission" button that creates OFP from booking data
- `flightStore.loadFromBooking()` — builds OFP from Booking API response
- Auto-connects demo mode with route coordinates when loading mission
- Uses `airports.ts` lookup for 60+ worldwide airport coordinates

#### 15. Fixed Position Updates (Reliable Telemetry)
- `flightStore.startPositionUpdates()` — proper `setInterval`-based 10s position push
- `App.tsx` uses `useEffect` with `startPositionUpdates` lifecycle (auto-cleanup on stop)
- Removed fragile React effect-based position push from Dashboard

#### 16. UI Enhancements
- Dashboard: "Connect Simulator" → tries auto-detect, falls back to demo
- Dashboard: Dedicated "Start Demo Mode" button
- Dashboard: "Simulator Disconnected" warning bar while tracking (with Reconnect)
- Header badge shows "SIMULATION" when in demo mode (green pulse)

### 🔴 REMAINING

1. **Add .mp3 files** to `acars/public/audio/announcements/` (user provides files)
2. **Test on Windows** with actual simulators
3. **Add tests**

### Next Session
1. User provides .mp3 files → place them in `acars/public/audio/announcements/`
2. Test & debug on actual Windows + sim setup

## Commands
- `pnpm install` (root)
- API dev: `cd api && pnpm dev`
- Web dev: `cd web && pnpm dev`
- ACARS dev: `cd acars && pnpm dev`
- DB: `cd api && pnpm db:push` (push schema), `pnpm db:studio` (Prisma Studio)
- Lint: `cd api && pnpm lint`, `cd web && pnpm lint`, `cd acars && pnpm lint`
