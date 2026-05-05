import { useState } from 'react'
import { useTheme } from '../lib/hooks/useTheme'
import {
  readSettings,
  writeLandingTab,
  writeNotificationOnboardingDone,
  type LandingTab,
} from '../lib/db/settings'
import {
  ensureNotificationPermission,
  getNotificationSupport,
  isIosWithoutStandalone,
} from '../lib/notifications/permission'
import {
  rearmAll,
  schedulerStatus,
  showTestNotification,
} from '../lib/notifications/scheduler'
import {
  exportAll,
  exportFilename,
  importAll,
  ImportSchemaError,
  parseExport,
} from '../lib/io/exportImport'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [landing, setLanding] = useState<LandingTab>(
    () => readSettings().defaultLandingTab,
  )
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    () => {
      const support = getNotificationSupport()
      return support.state === 'unsupported' ? 'unsupported' : support.permission
    },
  )
  const [testNotice, setTestNotice] = useState<string | null>(null)
  const [showIosHint, setShowIosHint] = useState<boolean>(() =>
    isIosWithoutStandalone(),
  )
  const status = schedulerStatus()

  function pickLanding(next: LandingTab) {
    setLanding(next)
    writeLandingTab(next)
  }

  async function requestPermission() {
    const result = await ensureNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      writeNotificationOnboardingDone(true)
      await rearmAll()
    }
  }

  async function triggerTest() {
    if (permission !== 'granted') return
    const ok = await showTestNotification(10_000)
    setTestNotice(
      ok
        ? 'Test-Benachrichtigung in ~10s.'
        : 'Konnte Test-Benachrichtigung nicht planen.',
    )
    setTimeout(() => setTestNotice(null), 8_000)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Erscheinungsbild
        </h2>
        <div className="flex gap-2">
          <ChoiceButton
            active={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            Hell
          </ChoiceButton>
          <ChoiceButton
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            Dunkel
          </ChoiceButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Standard-Startseite
        </h2>
        <div className="flex flex-wrap gap-2">
          <ChoiceButton active={landing === 'today'} onClick={() => pickLanding('today')}>
            Heute
          </ChoiceButton>
          <ChoiceButton active={landing === 'habits'} onClick={() => pickLanding('habits')}>
            Habits
          </ChoiceButton>
          <ChoiceButton active={landing === 'mood'} onClick={() => pickLanding('mood')}>
            Mood
          </ChoiceButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Benachrichtigungen
        </h2>
        <NotificationStatus permission={permission} status={status} />

        <div className="flex flex-wrap gap-2">
          {permission === 'default' && (
            <button
              type="button"
              onClick={requestPermission}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Berechtigung anfragen
            </button>
          )}
          <button
            type="button"
            onClick={triggerTest}
            disabled={permission !== 'granted'}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Test in 10s
          </button>
        </div>
        {testNotice && (
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            {testNotice}
          </p>
        )}
      </section>

      {showIosHint && (
        <section className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700/60 dark:bg-amber-950/30">
          <h2 className="font-medium text-amber-900 dark:text-amber-200">
            iOS: Zum Homescreen hinzufügen
          </h2>
          <p className="text-amber-900/80 dark:text-amber-100/80">
            Auf iPhone/iPad liefert der Browser nur dann Push-Benachrichtigungen,
            wenn ErinnerMich als Web-App installiert ist. Tippe auf <em>Teilen</em>
            {' → '}<em>Zum Home-Bildschirm</em>. Web Push wird in Phase 7 als
            verschlüsselter Multi-Device-Sync nachgereicht.
          </p>
          <button
            type="button"
            onClick={() => setShowIosHint(false)}
            className="self-start rounded-md border border-amber-400 px-2 py-1 text-xs hover:bg-amber-100 dark:border-amber-600 dark:hover:bg-amber-900/40"
          >
            Ausblenden
          </button>
        </section>
      )}

      <DataIO />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Datenschutz
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Alle Daten bleiben ausschließlich in deinem Browser (IndexedDB +
          localStorage). Es gibt keine Cookies, kein Analytics, keine
          Tracker. DSGVO-konform per Default.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>
          ErinnerMich · Daten werden ausschließlich lokal in deinem Browser
          gespeichert.
        </p>
        <p>Keine Cookies · Kein Tracking · DSGVO-konform</p>
      </section>
    </div>
  )
}

function DataIO() {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  )

  async function doExport() {
    setBusy(true)
    setNotice(null)
    try {
      const snap = await exportAll()
      const blob = new Blob([JSON.stringify(snap, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = exportFilename()
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setNotice({
        kind: 'ok',
        text: `Export: ${snap.reminders.length} Reminder, ${snap.events.length} Events.`,
      })
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Export fehlgeschlagen.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleFile(file: File, mode: 'merge' | 'replace') {
    setBusy(true)
    setNotice(null)
    try {
      const text = await file.text()
      const data = parseExport(JSON.parse(text))
      if (
        mode === 'replace' &&
        !confirm('Alle bestehenden Daten werden überschrieben. Fortfahren?')
      ) {
        setBusy(false)
        return
      }
      const summary = await importAll(data, { mode })
      setNotice({
        kind: 'ok',
        text: `Import (${mode}): ${summary.reminders} Reminder, ${summary.events} Events, ${summary.moodEntries} Mood-Einträge.`,
      })
    } catch (err) {
      const text =
        err instanceof ImportSchemaError
          ? `Schema-Fehler: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Import fehlgeschlagen.'
      setNotice({ kind: 'err', text })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
        Daten Export / Import
      </h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={doExport}
          disabled={busy}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Export (JSON)
        </button>
        <ImportButton mode="merge" onFile={handleFile} disabled={busy}>
          Import (Merge)
        </ImportButton>
        <ImportButton mode="replace" onFile={handleFile} disabled={busy}>
          Import (Ersetzen)
        </ImportButton>
      </div>
      {notice && (
        <p
          className={
            notice.kind === 'ok'
              ? 'text-xs text-emerald-700 dark:text-emerald-300'
              : 'text-xs text-rose-700 dark:text-rose-300'
          }
        >
          {notice.text}
        </p>
      )}
    </section>
  )
}

function ImportButton({
  mode,
  onFile,
  disabled,
  children,
}: {
  mode: 'merge' | 'replace'
  onFile: (file: File, mode: 'merge' | 'replace') => Promise<void>
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <label
      className={
        'inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 ' +
        (disabled ? 'pointer-events-none opacity-50' : '')
      }
    >
      <input
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void onFile(file, mode)
          event.target.value = ''
        }}
      />
      {children}
    </label>
  )
}

function NotificationStatus({
  permission,
  status,
}: {
  permission: NotificationPermission | 'unsupported'
  status: ReturnType<typeof schedulerStatus>
}) {
  if (permission === 'unsupported') {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Dein Browser unterstützt keine Benachrichtigungen.
      </p>
    )
  }
  if (permission === 'denied') {
    return (
      <p className="text-sm text-rose-700 dark:text-rose-300">
        Benachrichtigungen sind blockiert. Aktiviere sie in den
        Browser-Einstellungen, um Reminder zu erhalten.
      </p>
    )
  }
  if (permission === 'default') {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Bitte erlaube Benachrichtigungen, damit deine Reminder rechtzeitig
        ausgelöst werden.
      </p>
    )
  }
  const modeLabel =
    status.mode === 'triggers'
      ? 'Notification Triggers (im Hintergrund)'
      : status.mode === 'in-tab'
        ? 'setTimeout-Fallback (nur bei offenem Tab)'
        : 'nicht verfügbar'
  return (
    <p className="text-sm text-emerald-700 dark:text-emerald-300">
      Aktiv · Modus: {modeLabel}
    </p>
  )
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-md border px-3 py-1.5 text-sm ' +
        (active
          ? 'border-brand-500 bg-brand-100 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100'
          : 'border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800')
      }
    >
      {children}
    </button>
  )
}
