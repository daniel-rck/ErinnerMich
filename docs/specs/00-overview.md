# 00 – web-base-Foundation in ErinnerMich

ErinnerMich richtet sich nach der gemeinsamen Baseline aus
**[github.com/daniel-rck/web-base](https://github.com/daniel-rck/web-base)**. Lebende
Architektur-Doku gehört laut web-base-Konvention #6 ins Repo (`docs/specs/`).

## Übernommen

| Baustein | Quelle in web-base | Stand in ErinnerMich |
|---|---|---|
| **Linting/Formatting** | `cli/templates/oxc/*` | `oxlint.base.json` + `.oxfmtrc.json` (owned), `.oxlintrc.json` + `.prettierignore` (app); ersetzt Biome (web-base 0.4.0) |
| **Package Manager** | `bun@1.3.11` | `package.json` → `"packageManager"` |
| **Reusable CI** | `.github/workflows/web-app-ci.yml@main` | `.github/workflows/ci.yml` |
| **Layout-Foundation** | `cli/templates/layout/*` | `src/lib/ui/` (AppShell, AppHeader, AppNav, PageHeader, primitives, InstallButton, useInstallPrompt, ThemeToggle, useTheme, theme.css, index.ts) |
| **Token-System** | `src/lib/ui/theme.css` | **kanonische Design-Token-Quelle der App** (siehe unten) |
| **Accent-Hue** | `--accent-h` | `285` (Indigo) |
| **Dark-Mode** | `data-theme` + `useTheme`/`ThemeToggle` + `themeInitScript` | vollständig übernommen (siehe unten) |

## Token-System: volle Migration auf web-base

`src/index.css` importiert `src/lib/ui/theme.css` als alleinige Token-Quelle. ErinnerMichs
früheres eigenes Token-System wurde vollständig migriert:

- **Farben umbenannt:** `brand-*` → `accent-*` (Hue 285) · `text-primary/secondary/tertiary` →
  `fg / fg-muted / fg-subtle` · `surface-elevated/glass/glass-strong` → `surface` ·
  `border-subtle/strong` → `border` · `text-on-brand` → `white`.
- **Kategorie-Accents eingeebnet:** Die vier Mood/Wellness-Ramps `accent-mood/calm/grow/glow`
  hatten kein web-base-Äquivalent und wurden auf den einen `accent` zusammengeführt
  (Farbcodierung von Mood/Wellness-Karten entfällt).
- **Dimensionstokens inlined:** web-base hat keine `--space-*`/`--text-*`/`--radius-*`/`--motion-*`/
  `--elev-*`-Skalen. Diese Referenzen wurden auf ihre Rohwerte aufgelöst (kein Layout-Shift),
  das benannte Token-System ist damit entfernt.
- **Beibehaltene App-Extensions** (in `index.css`): `--color-*-soft` (per `color-mix` aus den
  semantischen Basisfarben abgeleitet, hell/dunkel-adaptiv), die `.surface-glass(-strong)`-Utilities
  (auf web-base-Surface-Token), `.skip-link` und der `focus-visible`-Ring (auf `accent-500`).

### Dark-Mode

Übernimmt web-bases Mechanismus vollständig: `useTheme`/`ThemeToggle` aus `src/lib/ui`,
gesteuert über das `data-theme`-Attribut (`system` = OS, `light`/`dark` = erzwungen), plus
`@custom-variant dark` (Tailwind-`dark:`-Utilities folgen `data-theme`) und das Anti-Flash-Script
in `index.html`. ErinnerMichs altes `.dark`-Klassen-Theme-System (`ThemeProvider`,
`lib/hooks/useTheme`, `themeContext`) wurde entfernt.

> Hinweis: Der localStorage-Key wechselte von `erinnermich:theme` auf web-bases `theme`.
> Bestehende Nutzer starten daher einmalig im `system`-Modus.

## .oxlintrc.json – Abweichungen von der Vorlage

- **Tests:** `typescript/no-non-null-assertion` ist in `__tests__` und `*.test.ts(x)` aus.
- **`scripts/**`:** `no-console` aus.

## Offene Foundation-Schritte (Roadmap)

- `noUncheckedIndexedAccess` app-weit aktivieren (`07-conventions.md`).
- Ggf. Mood/Wellness-Farbcodierung als web-base-Erweiterung neu konzipieren (statt eingeebnetem Accent).
