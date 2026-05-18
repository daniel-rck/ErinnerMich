# Mitmachen bei ErinnerMich

Danke, dass du beitragen möchtest! Egal ob Bugfix, neues Feature, Doku-Verbesserung oder Idee – jeder Beitrag hilft.

## Voraussetzungen

- [Bun](https://bun.sh/) installiert (bringt Runtime und Package Manager mit)
- Git
- Ein moderner Browser (Chromium-basiert oder Firefox empfohlen) für PWA-Features

## Setup

```bash
git clone https://github.com/daniel-rck/ErinnerMich.git
cd ErinnerMich
bun install
bun run dev
```

Der Dev-Server läuft danach auf <http://localhost:5173>.

## Branch-Strategie

- `main` ist immer stabil und deploybar
- Feature-Branches: `feature/<kurz-name>`
- Bugfixes: `fix/<kurz-name>`
- Docs/Chores: `docs/<kurz-name>` bzw. `chore/<kurz-name>`

PRs gehen gegen `main`.

## Vor dem PR

Alle drei Checks müssen lokal grün sein – die CI prüft dieselben:

```bash
bun run lint
bun run typecheck
bun run test
```

Bonus: `bun run build` zeigt, ob auch der Production-Build sauber durchläuft.

## Commits

Wir verwenden lockeres [Conventional Commits](https://www.conventionalcommits.org/de/v1.0.0/). Beispiele:

- `feat: Habit-Heatmap auf der Stats-Seite`
- `fix: Recurrence-Engine bei Schaltjahren`
- `docs: README-Setup-Anleitung erweitert`
- `refactor: ToolSession-Bootstrap entkoppeln`
- `test: Schedule-Engine Edge-Cases`
- `chore: Bun auf neueste Version`

## Code-Stil

- **TypeScript strict** – kein `any` ohne Begründung im Kommentar
- **ESLint** (Flat Config) – `bun run lint` muss durchlaufen
- **React Hooks** – Regeln einhalten, kein State in Render-Pfaden
- **Komponenten** kompakt halten, Logik in `src/lib/` auslagern
- **Keine neuen Dependencies** ohne triftigen Grund – wir halten den Bundle klein

## Tests

- Tests laufen mit **Vitest** + Testing Library
- Neue Features → neue Tests im `__tests__/`-Ordner des jeweiligen Bereichs (`src/lib/__tests__/`, oder neben die Komponente als `Foo.test.tsx`)
- IndexedDB im Test wird via `fake-indexeddb` simuliert (siehe `src/test/setup.ts`)

## PR-Checkliste

Beim Öffnen eines PRs siehst du eine vorausgefüllte Checkliste. Bitte alle Punkte abhaken (oder begründen, warum ein Punkt nicht zutrifft):

- [ ] `bun run lint` läuft durch
- [ ] `bun run typecheck` läuft durch
- [ ] `bun run test` läuft durch
- [ ] Doku angepasst, falls nötig
- [ ] Screenshots/GIF bei UI-Änderungen angehängt

## Sicherheits-Findings

Bitte **nicht** als öffentliches Issue – siehe [SECURITY.md](./SECURITY.md).

## Fragen?

Bei Unsicherheiten gerne ein Issue mit dem Label `question` öffnen oder den PR als Draft starten – wir gehen das gemeinsam durch.
