# ErinnerMich

Eine reine Browser-PWA für wiederkehrende Erinnerungen und Habit-Tracking.
Daten bleiben lokal im Browser — kein Account, kein Tracking, DSGVO-konform.

> Status: **Phase 0 (Setup)**. Funktional ist die App noch leer; das Repo
> enthält das vollständige Tooling (React 19, Vite 7, Tailwind 4, PWA,
> Vitest, Cloudflare Workers).

## Naming

- Branding / UI: `ErinnerMich` (CamelCase)
- Repo-Slug: `erinnermich` (lowercase)
- Geplante Domain: `erinnermich.daniel-rck.workers.dev`

## Tech-Stack

| Bereich | Wahl |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| PWA | `vite-plugin-pwa` (`injectManifest`, eigener Service Worker) |
| Tests | Vitest + Testing Library |
| Lokaler Storage | IndexedDB (Phase 1) + `localStorage` für Settings |
| Hosting | Cloudflare Workers + Static Assets |
| Package Manager | Bun |

## Lokal starten

```bash
bun install
bun run dev          # Vite Dev Server auf http://localhost:5173
bun run build        # Production Build nach dist/
bun run preview      # gebauten Stand lokal ausliefern
bun test             # Vitest einmalig
bun run test:watch   # Vitest watch mode
bun run lint         # ESLint
bun run typecheck    # tsc -b --noEmit
```

## Cloudflare Worker

```bash
bun run build           # erst dist/ erzeugen
bun run worker:dev      # wrangler dev — lokaler Worker mit Static Assets
bun run worker:deploy   # Deployment (CI / lokal)
```

## Projektstruktur

```
src/
├── App.tsx          # Skeleton mit Dark-Mode-Toggle
├── main.tsx
├── index.css        # Tailwind 4 Entry
├── sw/index.ts      # Service Worker (Workbox precache)
└── test/setup.ts    # Vitest Setup (jest-dom, cleanup)

worker/
└── index.ts         # Cloudflare Worker (Static-Asset-Routing + /healthz)

public/
├── logo.svg
└── logo-maskable.svg
```

## Roadmap

Siehe Plan-Dokument im Auftraggeber-Workflow. Phasen:

0. **Setup** (dieser Stand)
1. Datenmodell + IndexedDB
2. Schedule-Engine (Reminder & Habits)
3. UI MVP (Today, Habits, Liste, Form)
4. Notifications (Triggers API + Fallback)
5. Stats, Streaks, Habit-Heatmap, Inventar
6. Polish (Export/Import, Druckansicht, A11y)
7. Optional: Verschlüsselter Multi-Device-Sync

## Datenschutz

- Keine Cookies, keine Analytics, keine Third-Party-Calls
- Alle Reminder-, Habit- und Event-Daten liegen ausschließlich lokal
  (IndexedDB / `localStorage`)
- Optionaler Sync (Phase 7) überträgt nur AES-GCM-verschlüsselte Bytes

## Lizenz

[MIT](./LICENSE) © Daniel Rück
