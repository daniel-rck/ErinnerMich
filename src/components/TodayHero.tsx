import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, CheckCircle2, Clock } from 'lucide-react'
import { useReminders } from '../lib/hooks/useReminders'
import { useAllEvents } from '../lib/hooks/useAllEvents'
import { nextOccurrence } from '../lib/schedule/nextOccurrence'
import { streakStats } from '../lib/stats/streaks'
import { dayKeyForDate } from '../lib/stats/dayKey'
import type { Reminder, ReminderEvent } from '../lib/types'

interface HeroStats {
  dueTotal: number
  doneTotal: number
  bestStreak: number
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function greeting(now: Date): string {
  const h = now.getHours()
  if (h < 5) return 'Späte Stunde'
  if (h < 11) return 'Guten Morgen'
  if (h < 14) return 'Guten Tag'
  if (h < 18) return 'Guten Nachmittag'
  if (h < 22) return 'Guten Abend'
  return 'Gute Nacht'
}

function microcopy(ratio: number, due: number): string {
  if (due === 0) return 'Heute steht nichts an. Genieße den Tag.'
  if (ratio === 0) return 'Bereit, durchzustarten?'
  if (ratio < 0.34) return 'Ein guter Anfang.'
  if (ratio < 0.67) return 'Halbzeit — du schaffst das.'
  if (ratio < 1) return 'Stark, fast durch.'
  return 'Alles erledigt. Wow.'
}

function computeStats(
  reminders: Reminder[],
  events: readonly ReminderEvent[],
  now: Date,
): HeroStats {
  const todayKey = dayKeyForDate(now)
  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)

  const eventsToday = events.filter((e) => {
    const ts = e.triggeredAt ?? e.scheduledFor
    return (
      e.action === 'completed' &&
      ts != null &&
      ts >= dayStart.getTime() &&
      ts <= dayEnd.getTime()
    )
  })
  const completedReminderIds = new Set(eventsToday.map((e) => e.reminderId))

  let dueTotal = 0
  let doneTotal = 0
  for (const r of reminders) {
    if (!r.active) continue
    if (r.archivedAt != null) continue
    if (r.kind === 'mood') continue
    let dueToday: boolean
    if (r.kind === 'habit') {
      dueToday = true
    } else {
      const next = nextOccurrence(r.schedule, dayStart)
      dueToday = next !== null && next.getTime() <= dayEnd.getTime()
    }
    if (!dueToday) continue
    dueTotal += 1
    if (completedReminderIds.has(r.id)) doneTotal += 1
  }

  const eventsByReminder = new Map<string, ReminderEvent[]>()
  for (const e of events) {
    const list = eventsByReminder.get(e.reminderId) ?? []
    list.push(e)
    eventsByReminder.set(e.reminderId, list)
  }
  let bestStreak = 0
  for (const r of reminders) {
    if (r.kind !== 'habit' || !r.active) continue
    const habitEvents = eventsByReminder.get(r.id) ?? []
    const stats = streakStats(habitEvents, now)
    if (stats.current > bestStreak) bestStreak = stats.current
  }

  void todayKey
  return { dueTotal, doneTotal, bestStreak }
}

export function TodayHero() {
  const { reminders } = useReminders({ activeOnly: true })
  const { events } = useAllEvents()
  const now = useMemo(() => new Date(), [])

  const stats = useMemo(
    () => computeStats(reminders, events, now),
    [reminders, events, now],
  )
  const ratio =
    stats.dueTotal === 0 ? 0 : Math.min(1, stats.doneTotal / stats.dueTotal)

  return (
    <section
      aria-label="Tagesübersicht"
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-brand-50/60 via-white to-white p-5 dark:border-zinc-800 dark:from-brand-950/30 dark:via-zinc-900 dark:to-zinc-900"
    >
      <div className="flex items-center gap-5">
        <ProgressRing ratio={ratio} done={stats.doneTotal} due={stats.dueTotal} />
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {greeting(now)}
          </p>
          <h2 className="text-xl font-semibold leading-tight">
            {microcopy(ratio, stats.dueTotal)}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <MiniStat
          icon={<CheckCircle2 size={16} className="text-emerald-600" />}
          label="Erledigt"
          value={String(stats.doneTotal)}
        />
        <MiniStat
          icon={<Clock size={16} className="text-brand-600" />}
          label="Offen"
          value={String(Math.max(0, stats.dueTotal - stats.doneTotal))}
        />
        <MiniStat
          icon={<Flame size={16} className="text-amber-500" />}
          label="Streak"
          value={`${stats.bestStreak} d`}
        />
      </div>
    </section>
  )
}

function ProgressRing({
  ratio,
  done,
  due,
}: {
  ratio: number
  done: number
  due: number
}) {
  const size = 96
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ratio)

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={due === 0 ? 1 : due}
      aria-valuenow={done}
      aria-label={`${done} von ${due} erledigt`}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeLinecap="round"
          className="stroke-brand-500"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold leading-none tabular-nums">
          {done}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          / {due}
        </span>
      </div>
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-start gap-0.5 rounded-lg bg-white/60 px-3 py-2 dark:bg-zinc-800/40">
      <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  )
}
