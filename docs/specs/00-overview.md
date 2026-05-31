# 00 – web-base-Foundation in ErinnerMich

ErinnerMich richtet sich nach der gemeinsamen Baseline aus
**[github.com/daniel-rck/web-base](https://github.com/daniel-rck/web-base)**. Dieses Dokument hält
fest, welche Teile der `core`-Foundation übernommen wurden und wo ErinnerMich bewusst abweicht.
Lebende Architektur-Doku gehört laut web-base-Konvention #6 ins Repo (`docs/specs/`).

## Übernommen (additiv, ohne Funktionsverlust)

| Baustein | Quelle in web-base | Stand in ErinnerMich |
|---|---|---|
| **Linting/Formatting** | `cli/templates/biome/biome.json` | `biome.json` (verbatim, kleine Abweichungen unten); ersetzt ESLint |
| **Package Manager** | Konvention `bun@1.3.11` | `package.json` → `"packageManager": "bun@1.3.11"` |
| **Reusable CI** | `.github/workflows/web-app-ci.yml@main` | `.github/workflows/ci.yml` ruft den Workflow auf |
| **Layout-Foundation** | `cli/templates/layout/*` | verbatim unter `src/lib/ui/` (AppShell, AppHeader, AppNav, PageHeader, primitives, InstallButton, useInstallPrompt, theme.css, index.ts) |
| **Accent-Hue** | `--accent-h` (Konvention ErinnerMich → 285) | `src/lib/ui/theme.css` → `--accent-h: 285` (Indigo) |

## Bewusste Abweichungen (ErinnerMich ist reicher als die generischen Templates)

Die `core`-Templates sind schlanke Stubs. ErinnerMich besitzt bereits reichere, produktiv genutzte
Implementierungen. Diese bleiben erhalten; die web-base-Foundation liegt als kanonische Referenz daneben.

- **Storage:** ErinnerMich nutzt eine typisierte `idb`-Schicht (`src/lib/db/` mit 5 Stores, v2-Schema,
  `erinnermich-db`-Broadcast) und Domain-Hooks (`src/lib/hooks/`) statt des generischen
  `db.ts` + `useLiveQuery`-Stubs. Erfüllt die Baseline („local-first via idb"), bleibt aber app-spezifisch.
- **PWA / Service Worker:** ErinnerMich behält den reicheren SW (`src/sw/sw.ts`) inkl.
  Notification-Click-Routing an einen einzelnen Client; Strategie ist wie in der Baseline `injectManifest`.
- **UI / Design-System:** Die bestehende UI-Library (`src/components/ui/`), das Design-Token-System
  (`src/lib/design/`, `src/index.css`) und die produktive `AppShell` (`src/components/`, inkl. CenterFab,
  Mood-Log) bleiben in Verwendung. `src/lib/ui/` ist die kanonische web-base-Referenz und noch nicht
  in `main.tsx` verdrahtet.

## biome.json – Abweichungen von der Vorlage

- **`!**/*.css` ausgeschlossen:** Biomes CSS-Parser versteht Tailwind-v4-`@theme` nicht. In web-base
  liegt `theme.css` unter `cli/templates` und wird dort ohnehin nicht gelintet.
- **Inkrementelle Lint-Adoption:** Bei bestehendem Code laufen folgende Regeln vorerst als `warn`
  (sichtbar, blockieren CI nicht), um die laufende App nicht durch Massenänderungen zu gefährden –
  als Tech-Debt zum schrittweisen Aufräumen:
  `a11y/noSvgWithoutTitle`, `a11y/useButtonType`, `a11y/noAutofocus`,
  `a11y/useAriaPropsSupportedByRole`, `a11y/useSemanticElements`, `a11y/noLabelWithoutControl`,
  `a11y/useKeyWithClickEvents`, `suspicious/noArrayIndexKey` (plus `noNonNullAssertion` /
  `useExhaustiveDependencies` wie in der Vorlage).

## Offene Foundation-Schritte (Roadmap)

- `noUncheckedIndexedAccess` app-weit aktivieren (Konvention `07-conventions.md`); aktuell nur Ziel.
- a11y-/`noArrayIndexKey`-Warnungen schrittweise auf `error` hochziehen.
- Optional: Domain-Storage/PWA-Muster in web-base zurückspielen, falls sie dort die generischen
  Templates verbessern sollen.
