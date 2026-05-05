import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getReminder } from '../lib/db/reminders'
import { useEvents } from '../lib/hooks/useEvents'
import { getInventory } from '../lib/db/inventories'
import { streakStats } from '../lib/stats/streaks'
import {
  averageDaysBetweenCompletions,
  completionSummary,
} from '../lib/stats/completionRate'
import type { Inventory, Reminder, ReminderEvent } from '../lib/types'
import { formatDate, formatSchedule, formatTime } from '../lib/format'

export function ReminderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [loading, setLoading] = useState(true)
  const { events } = useEvents(id ?? null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id) return
      const [r, inv] = await Promise.all([getReminder(id), getInventory(id)])
      if (cancelled) return
      setReminder(r ?? null)
      setInventory(inv ?? null)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="text-sm text-zinc-500">Lade …</p>
  if (!reminder) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-500">Reminder nicht gefunden.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="self-start rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Zurück
        </button>
      </div>
    )
  }

  const streak = streakStats(events)
  const completions = completionSummary(events)
  const avgGap = averageDaysBetweenCompletions(events)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {reminder.icon}
        </span>
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">
            {reminder.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatSchedule(reminder.schedule)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/edit/${reminder.id}`)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Bearbeiten
        </button>
      </header>

      {reminder.description && (
        <p className="rounded-md bg-zinc-50 p-3 text-sm dark:bg-zinc-800/40">
          {reminder.description}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {reminder.kind === 'habit' && (
          <>
            <Metric label="Aktuelle Streak" value={`${streak.current} d`} />
            <Metric label="Längste Streak" value={`${streak.longest} d`} />
          </>
        )}
        <Metric
          label="7-Tage-Quote"
          value={`${Math.round(completions.last7.rate * 100)} %`}
        />
        <Metric
          label="30-Tage-Quote"
          value={`${Math.round(completions.last30.rate * 100)} %`}
        />
        {avgGap !== null && (
          <Metric label="Ø Abstand" value={`${avgGap.toFixed(1)} d`} />
        )}
      </section>

      {inventory && (
        <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
            Vorrat
          </h2>
          <p className="text-sm">
            {inventory.remaining} {inventory.unit} (Schwelle:{' '}
            {inventory.refillThreshold} {inventory.unit})
          </p>
          {inventory.lastRefillAt && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Letztes Auffüllen: {formatDate(new Date(inventory.lastRefillAt))}
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Verlauf ({events.length} Einträge)
        </h2>
        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Noch keine Aktivität.
          </p>
        ) : (
          <ul className="flex flex-col">
            {events.slice(0, 50).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function EventRow({ event }: { event: ReminderEvent }) {
  const ts = event.triggeredAt ?? event.scheduledFor
  const date = ts ? new Date(ts) : null
  return (
    <li className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2 text-sm last:border-b-0 dark:border-zinc-800">
      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
        {date ? `${formatDate(date)} ${formatTime(date)}` : '—'}
      </span>
      <span className="flex items-center gap-2">
        <ActionPill action={event.action} />
        {event.progress && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            +{event.progress.value} {event.progress.unit}
          </span>
        )}
        {event.note && (
          <span className="text-xs italic text-zinc-500 dark:text-zinc-400">
            „{event.note}"
          </span>
        )}
      </span>
    </li>
  )
}

const ACTION_LABELS: Record<ReminderEvent['action'], string> = {
  completed: 'Erledigt',
  snoozed: 'Snooze',
  skipped: 'Übersprungen',
  missed: 'Verpasst',
  progress: 'Fortschritt',
  dismissed: 'Verworfen',
}

const ACTION_CLASSES: Record<ReminderEvent['action'], string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  snoozed: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  skipped: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  missed: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
  progress: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
  dismissed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

function ActionPill({ action }: { action: ReminderEvent['action'] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_CLASSES[action]}`}
    >
      {ACTION_LABELS[action]}
    </span>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800/40">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-mono text-base">{value}</span>
    </div>
  )
}
