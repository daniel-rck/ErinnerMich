# ErinnerMich — Roadmap

> Lebendiges Dokument. Jede Phase wird in einer eigenen PR umgesetzt.
> Stand: Phase 0–4 abgeschlossen, Phase 5 Kern + Phase 6 Polish (Export/Import,
> Quick-Snooze, Keyboard-Shortcuts, A11y) eingebaut. Streak-Freeze,
> Habit↔Mood-Korrelation und Druckansicht (PrintWeek) als Follow-up offen.

## Naming

- UI / Branding: `ErinnerMich`
- Repo-Slug + `package.json#name` + Worker-Service: `erinnermich`
- Geplante Domain: `erinnermich.daniel-rck.workers.dev`

## Designprinzip

Ein einziges Datenmodell vereint drei Use-Cases — **Reminder**,
**Habit-Tracking** und **Mood-Tracking**. Sie sind *Flavors* eines
gemeinsamen `Reminder`-Records (`kind: 'reminder' | 'habit' | 'mood'`).
Schedule-Engine, Notifications, DB-Layer und Sync funktionieren für alle
drei identisch. Nur die UI (eigene Pages, eigene Card-Typen) und die
Stats-Aggregation unterscheiden zwischen den Modi.

## Tech-Stack

| Bereich | Wahl |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| PWA | `vite-plugin-pwa` mit `injectManifest` |
| Package Manager | Bun |
| Hosting | Cloudflare Workers + Static Assets |
| Lokaler Storage | `localStorage` (Settings) + IndexedDB via `idb` |
| State | React Context + Hooks |
| Tests | Vitest + Testing Library |
| Linting | ESLint flat config |
| CI | GitHub Actions (Lint + Typecheck + Test + Build) |
| Optional Sync | Cloudflare Workers + R2 + KV, AES-GCM/HKDF (Phase 7) |

## Datenmodell (Stand Phase 1)

```ts
type Reminder = {
  id: string                          // ulid
  kind: 'reminder' | 'habit' | 'mood'
  title: string
  description?: string
  category: CategoryKey
  icon: string
  color: string
  schedule: Schedule
  goal?: HabitGoal                    // nur bei kind: 'habit'
  moodConfig?: MoodConfig             // nur bei kind: 'mood'
  streakSensitive: boolean
  active: boolean
  archivedAt?: number
  createdAt: number
  updatedAt: number
}

type MoodConfig = {
  scale: 'five-emoji' | 'mood-energy-grid'   // einfache 1–5 Skala oder 2D-Grid
  promptText?: string                          // 'Wie geht es dir gerade?'
  tags: string[]                               // vorkonfigurierte Tags wählbar im Log
}

type Schedule =
  | { type: 'interval'; minutes: number; activeWindow?: { start: string; end: string } }
  | { type: 'daily'; times: string[] }
  | { type: 'weekly'; days: Weekday[]; time: string }
  | { type: 'biweekly'; days: Weekday[]; time: string; weekParity: 'even' | 'odd' }
  | { type: 'monthly'; dayOfMonth: number; time: string }
  | { type: 'yearly'; month: number; day: number; time: string; leadDays?: number }
  | { type: 'elapsed'; days: number; lastDone?: number }
  // Phase 2-Erweiterungen:
  | { type: 'expires'; expiresAt: number; preWarnings: PreWarning[] }
  | { type: 'inventory_based'; reminderId: string }   // triggert wenn Inventory.remaining < threshold

type PreWarning =
  | { kind: 'days'; value: number }       // 7, 30, 365 Tage vorher
  | { kind: 'months'; value: number }     // 1, 3, 6 Monate vorher
  | { kind: 'years'; value: number }      // 1 Jahr vorher

type HabitGoal =
  | { type: 'binary' }
  | { type: 'count'; target: number; unit: string }
  | { type: 'duration'; targetMinutes: number }

type ReminderEvent = {
  id: string
  reminderId: string
  scheduledFor?: number
  triggeredAt?: number
  action: 'completed' | 'snoozed' | 'skipped' | 'missed' | 'progress' | 'dismissed'
  progress?: { value: number; unit: string }
  snoozeUntil?: number
  note?: string
}

type Inventory = {
  reminderId: string
  remaining: number
  unit: string                        // 'Tabletten', 'Linsen', 'Blatt', 'Dose'
  refillThreshold: number             // Reminder feuert wenn remaining <= threshold
  lastRefillAt?: number
}

type MoodEntry = {
  id: string                          // ulid
  reminderId?: string                 // optionaler Link auf einen Mood-Reminder (Prompt)
  loggedAt: number
  mood: 1 | 2 | 3 | 4 | 5             // 😢 😕 😐 🙂 😄
  energy?: 1 | 2 | 3 | 4 | 5          // optional, nur bei 'mood-energy-grid'
  tags?: string[]                     // ['sport', 'stress', 'social', 'sleep-bad', 'work', ...]
  note?: string
}
```

## Templates

10 Reminder-Templates + 10 Habit-Templates + Pflicht-/Saison-/Countdown-Templates.

```ts
const REMINDER_TEMPLATES = [
  { key: 'plant',          icon: '🪴', title: 'Pflanze gießen',     schedule: { type: 'elapsed', days: 5 } },
  { key: 'med',            icon: '💊', title: 'Medikament',         schedule: { type: 'daily', times: ['08:00', '20:00'] }, hasInventory: true },
  { key: 'trash',          icon: '🗑️', title: 'Müll rausbringen',   schedule: { type: 'weekly', days: ['TUE'], time: '19:00' } },
  { key: 'birthday',       icon: '🎂', title: 'Geburtstag',         schedule: { type: 'yearly', leadDays: 3 } },
  { key: 'social',         icon: '📞', title: 'Bei … melden',       schedule: { type: 'elapsed', days: 21 } },
  // Pflicht- & Recurring-Tasks:
  { key: 'tax',            icon: '🧾', title: 'Steuererklärung',    schedule: { type: 'yearly', month: 5, day: 31, leadDays: 30 } },
  { key: 'gez',            icon: '📺', title: 'GEZ',                schedule: { type: 'monthly', dayOfMonth: 15 } },
  { key: 'insurance',      icon: '📑', title: 'Versicherung vergleichen', schedule: { type: 'yearly', month: 11, day: 1, leadDays: 14 } },
  { key: 'tuev',           icon: '🚗', title: 'TÜV / HU',           schedule: { type: 'expires', preWarnings: [{ kind: 'months', value: 3 }, { kind: 'months', value: 1 }, { kind: 'days', value: 7 }] } },
  { key: 'eyetest',        icon: '👁️', title: 'Sehtest / Augenarzt', schedule: { type: 'yearly', leadDays: 7 } },
  { key: 'preventive',     icon: '🩺', title: 'Vorsorge',           schedule: { type: 'yearly', leadDays: 14 } },
  // Saisonal:
  { key: 'tires',          icon: '❄️', title: 'Reifenwechsel',      schedule: { type: 'yearly', month: 10, day: 15, leadDays: 7 } },
  { key: 'heating',        icon: '🔥', title: 'Heizung warten',     schedule: { type: 'yearly', month: 9, day: 15, leadDays: 14 } },
  { key: 'garden-winter',  icon: '🍂', title: 'Garten winterfest',  schedule: { type: 'yearly', month: 10, day: 15, leadDays: 7 } },
  // Countdown / Vorfreude:
  { key: 'vacation',       icon: '🏖️', title: 'Urlaub',             schedule: { type: 'yearly', leadDays: 14 }, displayAs: 'countdown' },
  // Garantie / Ablauf:
  { key: 'warranty',       icon: '📦', title: 'Garantie',           schedule: { type: 'expires', preWarnings: [{ kind: 'months', value: 1 }, { kind: 'days', value: 7 }] } },
  { key: 'passport',       icon: '🛂', title: 'Reisepass',          schedule: { type: 'expires', preWarnings: [{ kind: 'months', value: 6 }, { kind: 'months', value: 1 }] } },
  { key: 'id-card',        icon: '🪪', title: 'Personalausweis',    schedule: { type: 'expires', preWarnings: [{ kind: 'months', value: 6 }, { kind: 'months', value: 1 }] } },
  // Vorrats-basiert (kein Schedule, sondern Trigger via Inventory):
  { key: 'contacts',       icon: '👓', title: 'Kontaktlinsen',      schedule: { type: 'inventory_based' }, hasInventory: true },
  { key: 'paper',          icon: '📄', title: 'Druckerpapier',      schedule: { type: 'inventory_based' }, hasInventory: true },
  { key: 'petfood',        icon: '🐾', title: 'Hundefutter',        schedule: { type: 'inventory_based' }, hasInventory: true },
]

const MOOD_TEMPLATES = [
  { key: 'mood-daily',   icon: '🙂', title: 'Tages-Stimmung',
    schedule: { type: 'daily', times: ['21:00'] },
    moodConfig: { scale: 'five-emoji', promptText: 'Wie war heute?', tags: ['sport', 'sozial', 'arbeit', 'schlaf', 'stress'] } },
  { key: 'mood-checkin', icon: '🧠', title: 'Mood-Check-in',
    schedule: { type: 'interval', minutes: 240, activeWindow: { start: '09:00', end: '21:00' } },
    moodConfig: { scale: 'mood-energy-grid', promptText: 'Mood + Energie jetzt?', tags: [] } },
  { key: 'gratitude',    icon: '🙏', title: 'Dankbarkeit',
    schedule: { type: 'daily', times: ['22:00'] },
    moodConfig: { scale: 'five-emoji', promptText: 'Wofür bist du heute dankbar?', tags: [] } },
]

const HABIT_TEMPLATES = [
  { key: 'water-habit',  icon: '💧', title: 'Wasser',         goal: { type: 'count', target: 8, unit: 'Glas' } },
  { key: 'steps',        icon: '👟', title: 'Schritte',       goal: { type: 'count', target: 10000, unit: 'Schritte' } },
  { key: 'read',         icon: '📖', title: 'Lesen',          goal: { type: 'duration', targetMinutes: 30 } },
  { key: 'exercise',     icon: '🏋️', title: 'Sport',          goal: { type: 'duration', targetMinutes: 45 } },
  { key: 'meditate',     icon: '🧘', title: 'Meditation',     goal: { type: 'duration', targetMinutes: 10 } },
  { key: 'journal',      icon: '📓', title: 'Journaling',     goal: { type: 'binary' } },
  { key: 'no-sugar',     icon: '🚫', title: 'Kein Zucker',    goal: { type: 'binary' } },
  { key: 'language',     icon: '🗣️', title: 'Sprache lernen', goal: { type: 'duration', targetMinutes: 15 } },
  { key: 'stretch',      icon: '🤸', title: 'Dehnen',         goal: { type: 'duration', targetMinutes: 10 } },
  { key: 'sleep',        icon: '😴', title: 'Schlafenszeit',  goal: { type: 'binary' } },
]
```

## Phasen

### Phase 0 — Setup ✅

Branch: `claude/document-naming-conventions-DCY8R`. Vite + React 19 + TS, Tailwind 4,
`vite-plugin-pwa` mit `injectManifest`, Vitest + Testing Library + jest-dom,
ESLint flat config, Cloudflare Worker (`worker/index.ts`) + `wrangler.toml` mit
Static Assets, GitHub Actions CI (Lint + Typecheck + Test + Build), App-Skeleton mit
ErinnerMich-Header + Dark-Mode-Toggle + Privacy-Footer.

### Phase 1 — Datenmodell + IndexedDB

- `idb`-Wrapper, ObjectStores `reminders`, `events`, `inventories`, `mood_entries`, `templates_used`
- Indizes: `reminders.byKind`, `reminders.byActive`, `events.byReminderId`, `events.byTriggeredAtDay`,
  `inventories.byThresholdRatio` (für `inventory_based`-Trigger),
  `mood_entries.byLoggedAtDay` (für Tages-/Wochen-/Monats-Aggregation)
- Hooks: `useReminders({ kind? })`, `useHabits()`, `useMoodReminders()`, `useEvents()`,
  `useInventory()`, `useDailyProgress(reminderId, date)`, `useExpiryRadar()`,
  `useLowStock()`, `useMoodEntries({ from, to })`, `useMoodAverage(period)`
- `BroadcastChannel('erinnermich-db')` für Multi-Tab-Sync
- Migrations-System (`dbVersion`)

### Phase 2 — Schedule-Engine

Pure Functions pro Schedule-Typ + Fassade `nextOccurrence` / `nextNOccurrences`:

- `interval` mit `activeWindow`
- `daily` mit `times[]`
- `weekly` + `biweekly`
- `monthly` (Monatsende-Clamp)
- `yearly` mit `leadDays`
- `elapsed` mit `lastDone`
- **`expires`**: gibt `[expiresAt, ...preWarningTimestamps]` zurück. Pre-Warnings
  abgelaufen lassen wenn `now > preWarning + 24h` (nicht doppelt feuern).
- **`inventory_based`**: kein Zeit-Schedule. Engine liefert `null` für Notifications;
  separater `inventoryWatcher` triggert beim Schreiben in `inventories` einen
  `ReminderEvent { action: 'progress' }` mit Notification, wenn `remaining <= refillThreshold`.

Edge-Cases-Tests: Schaltjahr, DST, Monatsende, Wochenrhythmus, Pre-Warning-Dedupe,
Inventory-Threshold-Crossing.

### Phase 3 — UI MVP

- Routing: `Today`, `Habits`, `Mood`, `Bald` (Countdown + Pflicht-Termine), `All`, `Stats`, `Settings`
- `TemplatePicker` mit Tabs: Reminder · Habits · Mood · Pflicht & Saison · Vorrat · Garantie
- `ReminderForm`:
  - Schedule-Editor je Typ
  - Bei `expires`: Date-Picker + Pre-Warning-Multiselect (1y / 6mo / 3mo / 1mo / 1w / 1d)
  - Bei `inventory_based`: Inventory-Setup-Block (Einheit, Anfangsmenge, Threshold)
  - Bei `kind: 'habit'`: HabitGoal-Editor
  - Bei `kind: 'mood'`: Skala-Auswahl (5-Emoji / Mood-Energy-Grid) + Tag-Liste + Prompt-Text
  - `displayAs: 'countdown'`-Toggle
- `ReminderCard` (Standard) / `HabitCard` (Fortschrittsring) /
  **`CountdownCard`** (Tage bis X, große Zahl, kein Notification-Spam) /
  **`ExpiryCard`** (verbleibende Zeit + nächste Pre-Warning) /
  **`StockCard`** (Vorrat in % + Refill-Button) /
  **`MoodLogCard`** (1-Tap-Emoji-Auswahl + optional Tags + Notiz-Sheet on Long-Press)
- Page `Mood.tsx`: 1-Tap-Logging (Emoji-Reihe), heutige Einträge als Mini-Timeline,
  optionaler 2D-Grid-Picker (Mood × Energie) wenn `scale: 'mood-energy-grid'`
- Page `Bald.tsx`: zeigt Countdown-Cards (Vorfreude) + Expiry-Warnungen + niedrige Vorräte
- Heute-Timeline gruppiert nach Tageszeit
- Habits-Dashboard mit Tageskomplettierung in %
- Erledigt-Flow + `+1`-Tap + Timer + Long-Press für Custom-Wert
- Mood-Quick-Log: Notification-Click auf Mood-Reminder öffnet 5-Emoji-Reihe direkt
  (oder schreibt direkt aus Notification-Action `mood-1` … `mood-5` ohne App-Öffnung)
- Refill-Flow: `Inventory` zurücksetzen, `lastRefillAt` updaten
- Dark-Mode persistent in `localStorage`

### Phase 4 — Notifications ✅

- `Notification.requestPermission()` erst beim Speichern des ersten aktiven Reminders
- `src/lib/notifications/triggers.ts`: Notification Triggers API (`showTrigger` mit
  `TimestampTrigger`); Tag-Konvention `reminder-{id}-{ts}`; Re-Arming pro Reminder
- Bei `expires`: alle Pre-Warning-Timestamps + `expiresAt` planen
- Bei `inventory_based`: kein Trigger, sondern bei DB-Write check (in App + SW)
- Bei `kind: 'mood'`: Notification mit 5 Emoji-Actions (😢 😕 😐 🙂 😄), die direkt
  einen `MoodEntry` schreiben — kein App-Öffnen nötig
- `inTab.ts`: `setTimeout`-Fallback wenn Tab offen / Triggers API fehlt
- SW `src/sw/sw.ts`: `notificationclick`-Handler liest `event.action`
  (`done` / `snooze-10/30/60` / `skip` / `+1` für Habits / `mood-1`…`mood-5` für Mood)
- Settings: "Test-Notification in 10 s"-Button
- iOS-Banner "Zum Homescreen hinzufügen" + Hinweis auf Phase-7-Sync für Push

### Phase 5 — Stats, Streaks, Mood-Insights, Inventar

- Habit-Stats: aktuelle / längste Streak, Erfüllungsquote 7/30/365 Tage,
  GitHub-Style-Heatmap, Wochenchart
- Reminder-Stats: Erledigt-Quote, Ø Tage zwischen Erledigungen (für `elapsed`),
  Letzte-Erledigt-Liste
- **Mood-Stats**:
  - Tages-/Wochen-/Monats-Durchschnitt (Liniendiagramm)
  - Mood-Heatmap (Kalender-Style mit Farbgradient grün → rot)
  - Wochenchart: Ø Mood pro Wochentag (Montag-Blues sichtbar machen)
  - **Tag-Korrelation**: Welche Tags treten an guten vs. schlechten Tagen auf?
  - **Habit ↔ Mood-Korrelation**: Tage mit Sport/Schlaf-Habit-Erfüllung vs. Tagesmood
    (einfache Pearson-Korrelation pro Habit)
- Streak-Freeze (1 Pause-Tag pro Monat)
- Inventar-Counter: Erledigt-Klick dekrementiert, automatischer "Vorrat niedrig"-Trigger
- Detail-Sheet pro Reminder mit voller Event-Historie

### Phase 6 — Polish

- JSON Export/Import (Schema-versioniert, inkl. `mood_entries`)
- Druckansicht `PrintWeek` (A4 Wochenraster + Habit-Häkchenboxen + Mood-Tageszelle)
- Schnell-Snooze 10/30/60/1d
- Habit-Reminder mit `+1`-Notification-Action
- Mood-Reminder mit 5-Emoji-Notification-Actions
- Keyboard-Shortcuts (`n` Reminder, `h` Habit, `m` Mood-Quick-Log, `g t/h/m/a/b` Navigation, `?` Hilfe)
- A11y-Pass (Lighthouse 100, axe-core grün, `prefers-reduced-motion`)

### Phase 7 — Optional Verschlüsselter Sync

- Worker mit R2 + KV (1:1 aus `daniel-rck/Hausverwaltung` portiert)
- HKDF + AES-GCM, Pairing per 6-stelligem Code
- Server kennt nur Bytes
- Conflict-Resolution mit `lastSyncAt`-Vergleich
- Web Push als Bonus (für iOS) — eigenes Subticket

## Cross-Cutting

- **Datenschutz**: keine Cookies, keine Analytics, kein externer CDN
- **iOS**: Notification Triggers API nicht verfügbar; Banner für Homescreen-Install;
  Web Push (Phase 7) als Fallback
- **Service Worker DB-Zugriff**: `src/lib/db/index.ts` muss SW-kompatibel sein
- **Error Boundaries**: Top-Level mit DB-Backup-Export bei Migrations-Fehlern
- **A11y**: 44 × 44 px Touch-Targets, `prefers-reduced-motion`, Focus-Visible global

## Out of Scope (bewusst)

- Kein Account-System, keine User-DB
- Keine geteilten Reminder zwischen Usern (höchstens innerhalb Sync-Profil)
- Keine native Mobile-App
- Kein Tracking, keine Werbung, keine Monetarisierung
