# 00 – web-base foundation in ErinnerMich

ErinnerMich follows the shared baseline
**[github.com/daniel-rck/web-base](https://github.com/daniel-rck/web-base)** and is
stamped `webBase.version: 0.6.0`. Living architecture docs belong in the repo
(`docs/specs/`, web-base convention #6). `web-base check --strict` passes: every
block (hygiene, oxc, testing, router, storage, pwa, worker, layout) is fully
adopted, and its owned files are byte-identical to the base.

## Adopted

| Building block | Source in web-base | State in ErinnerMich |
|---|---|---|
| **Linting/formatting** | `oxc` | `oxlint.base.json` + `.oxfmtrc.json` (owned), `.oxlintrc.json` + `.prettierignore` (app); replaced Biome in web-base 0.4.0 |
| **Package manager** | `bun@1.3.11` | `package.json` → `"packageManager"` |
| **CI** | `web-app-ci.yml`, `web-base-check.yml` | `.github/workflows/ci.yml`, both pinned `@v0.6.0` |
| **Testing** | `testing` | owned `src/test/setup.ts`; app setup in `src/test/appSetup.ts` (clears stores and `localStorage` after each test); `vitest.config.ts` merges `vite.config.ts` |
| **Design tokens** | `layout` → `src/lib/ui/tokens.css` (owned) | the only token source; `src/lib/ui/theme.css` is the seam |
| **Accent hue** | `--accent-h` | `305` (Violett), `theme_color` `#793bb0` (accent-600) |
| **Dark mode** | `data-theme` + `useTheme` + `public/theme-init.js` | fully adopted; the app ships its own `ThemeToggle` look |
| **Router** | `router` | data router (`createBrowserRouter`), the app shell as root layout route, `RouteError`/`NotFound`/`RouteFallback` |
| **Storage** | `storage` → `open.ts`, `mutations.ts` | `getDB` from `createDBOpener` (DB `erinnermich`, version 2) |
| **PWA** | `pwa` → `src/sw/base.ts`, `src/lib/pwa/*` | `registerAppShell()` + the app's notification handlers; prompt-based updates via `<UpdatePrompt />` |
| **Worker** | `worker` → `worker/base.ts`, `public/_headers` | `routeRequest` with an API that answers 404; SPA mode in `wrangler.toml` |

## Theme

`src/index.css` imports `src/lib/ui/theme.css`, which imports the owned
`tokens.css` (surfaces, foregrounds, semantic colors and their `*-fg` text
variants, radii, shadows, motion tokens, the `dark:` variant and the
`prefers-reduced-motion` reset), sets `--accent-h: 305` and adds the app's own
tokens:

- `accent-soft` / `accent-softer` / `accent-fg`: the pastel accent surface (active
  nav pill, chips) and accent text on it. Dark mode mixes `accent-900` into the
  surface, because `accent-50/100` have no dark override.
- `--color-{success,warning,danger,info}-soft`: semantic tints derived with
  `color-mix`, adapting to light/dark.

`index.css` keeps only app globals: the focus outline, the skip link, the
48 px coarse-pointer tap target and the `.surface-glass(-strong)` utilities.
Accent-tinted shadows use `oklch(… var(--accent-h) / …)` so they follow the hue.

History: ErinnerMich's earlier token system was migrated onto web-base
(`brand-*` → `accent-*`, `text-primary/secondary/tertiary` → `fg / fg-muted /
fg-subtle`, the four mood/wellness ramps merged into the one accent, the
`--space-*`/`--text-*`/`--radius-*`/`--motion-*`/`--elev-*` scales inlined). The
theme's localStorage key moved from `erinnermich:theme` to web-base's `theme`.

## Router

`src/lib/router.tsx` builds the route table; `src/lib/routes.ts` holds the paths.
The URLs are unchanged from the `BrowserRouter` era and are part of the product
(manifest shortcuts `/new?kind=…` and `/?mood=open`, the share target `/new`,
notification deep links `/?notif=…`).

```
/  (App: providers, bootstraps, onboarding, landing redirect, AppShell + <Outlet/>)
│    ErrorBoundary: AppRouteError   HydrateFallback: RouteFallback
└── (pathless, ErrorBoundary: AppRouteError — page errors render inside the shell)
    ├── index → Today          ├── habits, all, stats, settings (legacy, kept)
    ├── mood, library, you     ├── new, edit/:id, detail/:id
    ├── tools, tools/:toolKey  (React.lazy + Suspense „Lade …“)
    └── *  → NotFound (web-base)
```

`AppRouteError` renders web-base's `RouteError` (German copy, chunk-error
reload) and adds a JSON backup export, because all data lives only in this
browser. The class `ErrorBoundary` in `main.tsx` stays as the last resort for
anything outside the routes.

## Service worker and updates

`src/sw/index.ts` calls `registerAppShell()` and then registers the app's
`notificationclick` handler: it routes an action to exactly one open tab
(focused first) via `postMessage`, or opens `/?notif=<action|id|scheduledFor|kind>`
when no tab is open. A new version waits until the user accepts the update in
`<UpdatePrompt />`, which posts `SKIP_WAITING`; notification handling doesn't
depend on which version is active. The built script is `/index.js` (before
web-base 0.6.0: `/sw.js`); the browser moves the existing registration over when
the new page registers it.

## Worker

The app has no backend. `worker/index.ts` passes every request to web-base's
`routeRequest`: `/healthz`, a 404 for stale `/assets/*`, the static assets
(SPA fallback through `not_found_handling = "single-page-application"`), and
`handleApi`, which answers every `/api` request with 404. `public/_headers`
carries a strict CSP; the only widening is `worker-src blob:` for
`canvas-confetti`'s Blob-URL worker. `compatibility_date` and `nodejs_compat`
are unchanged on purpose (web-base `08-app-migrations.md`, "Deferred").

## Storage

`src/lib/db/db.ts` defines the schema and the `if (oldVersion < N)` migration
ladder and opens the database with `createDBOpener` (shared connection, reopen
after the browser drops it, no cached failed open, close + reload when another
tab upgrades). Reads go through the app's typed BroadcastChannel layer
(`src/lib/db/broadcast.ts`, `src/lib/hooks/useDbQuery.ts` with a latest-wins
`runToken`) instead of `useLiveQuery`, which ships as an owned file but is unused.

## `.oxlintrc.json` – deviations from the template

- **Tests:** `typescript/no-non-null-assertion` is off in `__tests__` and `*.test.ts(x)`.
- **`scripts/**`:** `no-console` off.

## Open items

- `web-base pins` reports several packages as `ahead` of the fleet pin table
  (e.g. `vitest` 5, `react` 19.3); `pins --apply` would downgrade them, so it is
  not run.
- Pages don't call `useDocumentTitle()` yet; the document title stays „ErinnerMich“.
- Possibly re-introduce mood/wellness color coding as a web-base extension
  (instead of the merged single accent).
