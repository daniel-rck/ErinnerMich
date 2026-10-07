# Claude-Code-Hinweise für ErinnerMich

Local-First-PWA für wiederkehrende Erinnerungen, Habits, Mood-Tracking und
optionale Wellness-Tools. Kein Account, kein Backend, keine Telemetrie — alle
Daten liegen in IndexedDB im Browser des Nutzers.

## Quelle der Wahrheit

**Foundation [`daniel-rck/web-base`](https://github.com/daniel-rck/web-base)** —
Stack, Layout-System, Storage-/PWA-/Router-/CI-Konventionen. Bei ungeklärten
Entscheidungen die minimale, zu den bestehenden Mustern passende Variante
wählen. Scaffolding & Updates über die CLI (`bunx github:daniel-rck/web-base …`),
nicht von Hand kopieren. `.github/workflows/ci.yml` fährt zusätzlich den
Drift-Guard `web-base-check` (gepinnt `@v0.6.0`, Stand `webBase.version` in
`package.json`) — wer eine *owned* Datei anfasst, bricht die CI.
`web-base check --strict` ist grün; alle Blöcke sind vollständig übernommen.

## Quality Gates

Vor jedem Commit grün halten:

```bash
bun run lint        # oxlint + oxfmt --check
bun run typecheck   # tsc -b (App + Node + SW + Worker)
bun run test        # Vitest
bun run build       # SPA + PWA
```

## Konventionen (gemäß web-base)

- **Bun** als Runtime & Package-Manager (kein npm/yarn-Lockfile).
- **oxlint + oxfmt** für Lint + Format — `oxlint.base.json` und `.oxfmtrc.json`
  kommen aus web-base und werden überschrieben; app-eigene Regeln gehören in
  `.oxlintrc.json` (`overrides`), Format-Ausnahmen in `.prettierignore`.
- **TypeScript strict** inkl. `noUncheckedIndexedAccess`;
  `verbatimModuleSyntax` (→ `import type`); `type` statt `interface`.
- **Deutsche UI + README, englischer Quellcode** (Bezeichner, Kommentare,
  Commits, `docs/`).
- **App-Daten in IndexedDB** (`idb`), `localStorage` nur für Settings und die
  Theme-Wahl (`theme`, gelesen von `public/theme-init.js` vor dem ersten Paint).
- **Design-Tokens statt Roh-Paletten**: `bg-surface`, `text-fg-muted`,
  `border-border`, `text-danger-fg` … aus `src/lib/ui/tokens.css` (owned, nie
  editieren). `src/lib/ui/theme.css` ist die Naht: `--accent-h` plus die
  app-eigenen Tokens (`accent-soft/-softer/-fg`, `*-soft`-Tönungen). Text auf
  einer semantischen Tönung nimmt `text-*-fg`, Text auf einer Akzentfläche
  `text-fg-on-accent`. Neue `zinc-*`/`slate-*`-Klassen sind ein Review-Fehler.
- **Fokus sichtbar lassen**: kein `outline-none` an Bedienelementen ohne Ersatz
  als echte `outline` (z. B. `focus-within:outline-2` am umschließenden Pill) —
  ein Box-Shadow-Ring oder Farbwechsel verschwindet im Forced-Colors-Modus.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## App-spezifische Leitplanken

- **Akzent ist `--accent-h: 305`** (Violett, `theme_color` `#793bb0` =
  accent-600) laut Hue-Tabelle in web-bases `04-layout-system.md`. Der Wert steht
  in `theme.css`, `vite.config.ts` (`theme_color`) und `index.html`
  (`<meta name="theme-color">`) — alle drei zusammen ändern. Akzentgetönte
  Schatten lesen `var(--accent-h)` statt einer festen Zahl.
- **Keine Netzwerk-Requests.** Die App hat keinen API-Client und soll keinen
  bekommen; Schriften und Assets liegen im Repo. Die CSP in `public/_headers`
  ist entsprechend eng (`connect-src 'self'`); einzige Erweiterung ist
  `worker-src blob:` für den Konfetti-Worker von `canvas-confetti`.
- **Benachrichtigungen** laufen über den Service Worker (`src/sw/index.ts`) plus
  `src/lib/notifications/`. Permission wird *nur* auf eine Nutzergeste hin
  angefragt (`ensureNotificationPermission`), nie beim Start.
- **Service Worker**: `src/sw/base.ts` (owned, `registerAppShell()`) macht
  Precache, Offline-Navigation und das Update auf Zuruf; `src/sw/index.ts`
  enthält nur die app-eigenen Handler (`notificationclick`). Kein eigenes
  `skipWaiting()`/`clientsClaim()`/`precacheAndRoute()`. Eine neue Version
  wartet, bis der Nutzer im `<UpdatePrompt />` (`main.tsx`) „Neu laden“ wählt.
  Das gebaute Script heißt seit web-base 0.6.0 `/index.js` (vorher `/sw.js`).
- **Router**: Data-Router (`createBrowserRouter`) in `src/lib/router.tsx`,
  Pfade in `src/lib/routes.ts`. `src/App.tsx` ist die Root-Layout-Route
  (Provider, Bootstraps, `AppShell` mit `<Outlet />`); Fehler fängt
  `AppRouteError` (web-base-`RouteError` + JSON-Export als Rettungsanker), `*`
  ist web-bases `NotFound`. URLs sind Produkt (Manifest-Shortcuts, Share-Target,
  `?notif=`-Deep-Links) — nie umbenennen.
- **Schedule-Engine** (`src/lib/schedule/`) ist rein und vollständig getestet —
  jede Änderung an `nextOccurrence`/`dailyEngine` braucht einen Test.
- **Export/Import** (`src/lib/io/`) ist der einzige Datenausgang. Das Format ist
  versioniert; ein Feld entfernen heißt, den Import abwärtskompatibel halten.
- **`src/lib/at.ts`** ist der Zugriffshelfer für `noUncheckedIndexedAccess`:
  `at(arr, i)` wirft statt still `undefined` zu liefern. Nicht durch `!` ersetzen.
- **`prefers-reduced-motion` respektieren** — Framer-Motion-Karten und
  Konfetti haben jeweils einen statischen Zweig.

## Akzeptierte Abweichungen von web-base

- **Struktur**: die App gliedert nach `src/components/` + `src/pages/` statt nach
  `src/features/<modul>/`. Ein Umbau wäre eine reine Umbenennung ohne Nutzen;
  neue Domänenlogik gehört trotzdem nach `src/lib/<domäne>/`.
- **Shell**: `src/lib/ui/` trägt das komplette web-base-Layout-System (owned,
  inkl. des ungenutzten `AppShell`/`AppHeader`/`AppNav`/`PageHeader`/`ThemeToggle`),
  die App-Shell selbst bleibt `src/components/AppShell.tsx` — Begrüßungs-Header,
  zentraler FAB, Bottom-Nav, Desktop-Side-Nav, Shortcut-Layer — und wird von
  `src/App.tsx` als Root-Layout-Route gerendert. Eigener `ThemeToggle` in
  `src/components/` (IconButton-Optik), der Hook ist der geteilte `useTheme`.
- **Tools-Seiten** laden per `React.lazy` + `<Suspense>` im Element statt per
  Route-`lazy`, damit die Shell während des Ladens „Lade …“ zeigt statt die
  vorige Seite festzuhalten.
- **Worker ohne API**: `worker/index.ts` delegiert an web-bases `routeRequest`
  (SPA-Fallback, `/healthz` → `{ ok: true }`, 404 für veraltete `/assets/*`);
  `handleApi` antwortet immer 404. `compatibility_date` (2025-10-01) und
  `nodejs_compat` sind bewusst unverändert — einzeln, mit Deploy-Check ändern.
- **Storage**: `src/lib/db/db.ts` öffnet die DB über web-bases `createDBOpener`
  (Name `erinnermich`, Version 2 — nie ändern ohne neue Migrationsstufe). Statt
  `useLiveQuery` fährt die App eine getippte `BroadcastChannel`-Schicht
  (`src/lib/db/broadcast.ts` + `src/lib/hooks/use*.ts` über `useDbQuery`, mit
  Latest-Wins-`runToken`), die auch über Tabs hinweg invalidiert.
  `useLiveQuery.ts`/`mutations.ts` liegen als owned Dateien bei; `clearAll()`
  nutzt `clearStores` für die Tests (`src/test/appSetup.ts`).
- **Pins voraus**: einige Abhängigkeiten (u. a. `vitest` 5, `react` 19.3,
  `wrangler`, `lucide-react`) stehen über web-bases Pin-Tabelle. `web-base pins`
  meldet sie als `ahead`; `pins --apply` würde sie zurückstufen — nicht ausführen.
