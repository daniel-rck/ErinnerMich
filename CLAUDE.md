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
Drift-Guard `web-base-check` — wer eine *owned* Datei anfasst, bricht die CI.

## Quality Gates

Vor jedem Commit grün halten:

```bash
bun run lint        # Biome (check)
bun run typecheck   # tsc (App + SW)
bun run test        # Vitest
bun run build       # SPA + PWA
```

## Konventionen (gemäß web-base)

- **Bun** als Runtime & Package-Manager (kein npm/yarn-Lockfile).
- **Biome** für Lint + Format — `biome.base.json` kommt aus web-base und wird
  überschrieben, app-eigene Regeln gehören in `biome.json` (`extends`).
- **TypeScript strict** inkl. `noUncheckedIndexedAccess`;
  `verbatimModuleSyntax` (→ `import type`); `type` statt `interface`.
- **Deutsche UI + README, englischer Quellcode** (Bezeichner, Kommentare,
  Commits, `docs/`).
- **App-Daten in IndexedDB** (`idb`), `localStorage` nur für Settings und die
  Theme-Wahl (`theme`, gelesen von `public/theme-init.js` vor dem ersten Paint).
- **Design-Tokens statt Roh-Paletten**: `bg-surface`, `text-fg-muted`,
  `border-border`, `text-danger` … aus `src/lib/ui/theme.css`. Neue
  `zinc-*`/`slate-*`-Klassen sind ein Review-Fehler.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## App-spezifische Leitplanken

- **Keine Netzwerk-Requests.** Die App hat keinen API-Client und soll keinen
  bekommen; Schriften und Assets liegen im Repo.
- **Benachrichtigungen** laufen über den Service Worker (`src/sw/`) plus
  `src/lib/notifications/`. Permission wird *nur* auf eine Nutzergeste hin
  angefragt (`ensureNotificationPermission`), nie beim Start.
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
- **Shell**: `src/lib/ui/` trägt das web-base-Layout-System (`theme.css`,
  `primitives`, `useTheme`, `InstallButton`), die App-Shell selbst bleibt in
  `src/App.tsx` — sie ist reicher als das `AppShell`-Scaffold (Bottom-Nav,
  Quick-Capture-Sheet, Shortcut-Layer) und komponiert dessen Bausteine.
- **Kein Worker-Sync**: `wrangler.toml` liefert nur die statischen Assets aus.
- **Storage**: statt `useLiveQuery` fährt die App eine getippte
  `BroadcastChannel`-Schicht (`src/lib/db/broadcast.ts` + `src/lib/hooks/use*.ts`),
  die auch über Tabs hinweg invalidiert. Bekannte Lücke: die Hooks setzen State
  nach dem `await` ohne Latest-Wins-Token — zwei überlappende `reload()` können
  in falscher Reihenfolge landen. Beim nächsten Anfassen eines Hooks mitfixen
  (Vorbild: `runToken` in web-bases `useLiveQuery`).
