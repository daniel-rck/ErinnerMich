# Deep Fixup — Session-Plan (2026-06-09)

> Ausführungsplan dieser Fixup-Session. Die Projekt-Roadmap liegt jetzt in
> [docs/ROADMAP.md](./docs/ROADMAP.md).

**Baseline (Start der Session, alles grün):**

- `bun run lint` → exit 0 (68 Warnings, 8 Infos — warn-level per dokumentierter
  inkrementeller Adoption, siehe docs/specs/00-overview.md)
- `bun run typecheck` → sauber
- `bun run test` → 45 Dateien, 256/256 grün
- `bun run build` → erfolgreich (PWA precache 13 Einträge)

**Vollverifikation:** `bun run lint && bun run typecheck && bun run test && bun run build`

## Tasks

- [x] T1: Move roadmap to docs/ROADMAP.md and write session PLAN.md
      Files: PLAN.md → docs/ROADMAP.md, README.md:123, neues PLAN.md
      Change: `git mv`, README-Link aktualisieren, Session-Plan als PLAN.md.
      Verify: keine veralteten PLAN.md-Referenzen; Lint grün.

- [x] T2: Fix in-tab notifications dying after the 24h arming horizon
      Files: src/lib/notifications/scheduler.ts, src/lib/notifications/__tests__/scheduler.test.ts
      Bug: `armInTabTimers` armiert nur 24h voraus; nichts re-armiert danach
      (kein Interval, kein visibility-Handler). Da die Notification Triggers API
      in realen Browsern fehlt, ist In-Tab der einzige funktionierende Pfad —
      ein offen gelassenes PWA-Fenster benachrichtigt nach spätestens 24h nicht mehr.
      Change: stündliches `rearmAll()`-Interval in `startScheduler`, aufgeräumt in
      `stopScheduler`/`_resetSchedulerForTests`; Kommentar zum 24h-Horizont.
      Verify: neuer Test mit Fake-Timern (+1h → Timer wieder armiert); `bun run test`.

- [x] T3: Broadcast a full reload after import so merge-imports show up without refresh
      Files: src/lib/io/exportImport.ts:156-165, src/lib/io/__tests__/exportImport.test.ts
      Bug: Merge-Import broadcastet nur `reminder-changed`/`tool-added` — importierte
      Events/Moods/Inventories erscheinen erst nach Reload.
      Change: kompletten Broadcast-Block durch ein einzelnes
      `broadcast({ type: "db-cleared" })` für beide Modi ersetzen (alle Hooks +
      Scheduler behandeln es als Reload-/Rearm-All). Tests anpassen.
      Verify: `bun run test`.

- [x] T4: Stop swallowing notification-path promise rejections
      Files: src/lib/notifications/inTab.ts, src/lib/notifications/scheduler.ts
      Change: try/catch + `console.error` in `fireInTab` und Test-Notification;
      `.catch`-Logging im subscribe-Callback von `startScheduler`.
      Verify: `bun run test && bun run lint`.

- [x] T5: Add the spec'd top-level error boundary with data-export escape hatch
      Files: neu src/components/ErrorBoundary.tsx + Test, src/main.tsx,
      src/lib/io/exportImport.ts, src/pages/Settings.tsx
      Gap: Roadmap (Cross-Cutting) verspricht Top-Level Error Boundary mit
      DB-Backup-Export; existiert nicht — Render-Fehler = White-Screen.
      Change: `downloadExport()`-Helper aus Settings extrahieren (Wiederverwendung),
      ErrorBoundary-Klasse mit „Neu laden" + „Daten exportieren (JSON)"-Fallback,
      `<App />` in main.tsx wrappen.
      Verify: neuer Test (werfendes Kind → Fallback + Export-Spy); `bun run test && bun run build`.

- [x] T6: Delete dead UI primitives and dead barrels
      Files: löschen: src/components/ui/{FormField,ListItem,SegmentedControl,index}.tsx|ts,
      src/lib/hooks/index.ts, src/lib/design/index.ts,
      src/components/ui/__tests__/{FormField,SegmentedControl}.test.tsx;
      `Select`/`Textarea` aus src/components/ui/Input.tsx entfernen (Input bleibt).
      Hinweis: src/lib/ui/** (vendored web-base-Foundation) bleibt unangetastet.
      Verify: `bun run typecheck && bun run test && bun run build`.

- [ ] T7: Remove unused workbox-window dependency
      Files: package.json, bun.lock
      Change: `bun remove workbox-window` (kein Import, Registrierung läuft über
      vite-plugin-pwa `injectRegister: "auto"`).
      Verify: `bun run build` erzeugt weiterhin dist/registerSW.js + dist/sw.js.

- [ ] T8: Sync docs to reality (Biome migration + structure drift) and bump biome schema
      Files: README.md (Lint-Kommentar Biome, Projektstruktur sw/sw.ts + Tools/Pages,
      Wellness-Tools-Bullet), CONTRIBUTING.md (ESLint → Biome),
      docs/ROADMAP.md (Linting-Zeile, Shortcut-Liste, Error-Boundary-Status),
      biome.json ($schema 2.4.15 → 2.4.16).
      Verify: `bun run lint` ohne Schema-Warnung; kein „eslint" mehr in den Docs.

- [ ] T9: Final verification + close out
      Change: Vollverifikation, alle Tasks abhaken, push, Draft-PR.
      Verify: alles grün; PR existiert.

## Verworfene Findings (geprüft, nicht actionable)

- „Fehlendes Pre-Warning-Dedupe" im expiresEngine: kein Doppel-Feuern möglich
  (future-only Arming, eindeutige Tags pro Timestamp). Late-Firing < 24h ist
  bewusst nicht implementiert → „Nicht in dieser Session".
- „MoodLogSheet stale closure": `reset()` ruft nur stabile State-Setter — harmlos.
- „Inkonsistentes Delete-Broadcasting": kein konstruierbares Fehlszenario.
- 68 Biome-Warnings: dokumentierte inkrementelle Adoption (docs/specs/00-overview.md).

## Nicht in dieser Session

- Late-Firing verpasster Pre-Warnings (< 24h) bei `expires` — braucht UX-Konzept.
- a11y-Lint-Regeln warn → error anheben und die ~68 Warnings abbauen (Roadmap).
- `noUncheckedIndexedAccess` app-weit aktivieren (Roadmap).
- SW-seitiges Re-Arming bei geschlossener App (Plattform-Limit; Phase-7 Web Push).
