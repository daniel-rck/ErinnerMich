import { useMemo, useState } from 'react'
import { useReminders } from '../lib/hooks/useReminders'
import { useAllEvents } from '../lib/hooks/useAllEvents'
import { useMoodEntriesInRange } from '../lib/hooks/useMoodEntries'
import { Heatmap } from '../components/charts/Heatmap'
import { WeekdayBar } from '../components/charts/WeekdayBar'
import { Sparkline } from '../components/charts/Sparkline'
import { currentStreakWithFreeze, streakStats } from '../lib/stats/streaks'
import {
  averageDaysBetweenCompletions,
  completedCount,
  completionSummary,
} from '../lib/stats/completionRate'
import {
  dailyMoodSeries,
  moodByWeekday,
  moodOverview,
  tagRollup,
} from '../lib/stats/moodAggregates'
import { habitMoodCorrelations } from '../lib/stats/correlations'
import type { ReminderEvent } from '../lib/types'
import { dayKeyForDate } from '../lib/stats/dayKey'
import { formatRelativeDate } from '../lib/format'

type Tab = 'habits' | 'reminders' | 'mood'

export function StatsPage() {
  const [tab, setTab] = useState<Tab>('habits')
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Statistik</h1>
      <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        <TabButton active={tab === 'habits'} onClick={() => setTab('habits')}>
          Habits
        </TabButton>
        <TabButton
          active={tab === 'reminders'}
          onClick={() => setTab('reminders')}
        >
          Reminder
        </TabButton>
        <TabButton active={tab === 'mood'} onClick={() => setTab('mood')}>
          Mood
        </TabButton>
      </nav>

      {tab === 'habits' && <HabitStats />}
      {tab === 'reminders' && <ReminderStats />}
      {tab === 'mood' && <MoodStats />}
    </div>
  )
}

function TabButton({
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
        'border-b-2 px-3 py-2 text-sm font-medium transition-colors ' +
        (active
          ? 'border-brand-500 text-brand-700 dark:text-brand-300'
          : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100')
      }
    >
      {children}
    </button>
  )
}

function HabitStats() {
  const { reminders } = useReminders({ kind: 'habit' })
  const { events, loading } = useAllEvents()

  const eventsByReminder = useMemo(
    () => groupByReminder(events),
    [events],
  )

  if (loading) return <Loading />
  if (reminders.length === 0) return <Empty>Noch keine Habits.</Empty>

  return (
    <div className="flex flex-col gap-6">
      {reminders.map((habit) => {
        const habitEvents = eventsByReminder.get(habit.id) ?? []
        const streak = streakStats(habitEvents)
        const freeze = currentStreakWithFreeze(habitEvents)
        const summary = completionSummary(habitEvents)
        const heatmapValues = buildHeatmapValues(habitEvents)
        return (
          <article
            key={habit.id}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <header className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {habit.icon}
              </span>
              <h2 className="font-medium">{habit.title}</h2>
            </header>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Metric label="Aktuelle Streak" value={`${streak.current} d`} />
              <Metric
                label="Mit Freeze"
                value={
                  freeze.freezesUsed > 0
                    ? `${freeze.length} d (❄ ${freeze.freezesUsed})`
                    : `${freeze.length} d`
                }
              />
              <Metric label="Längste Streak" value={`${streak.longest} d`} />
              <Metric
                label="30-Tage-Quote"
                value={`${Math.round(summary.last30.rate * 100)} %`}
              />
            </div>
            <Heatmap
              values={heatmapValues}
              ariaLabel={`Heatmap für ${habit.title}`}
            />
          </article>
        )
      })}
    </div>
  )
}

function ReminderStats() {
  const { reminders } = useReminders({ kind: 'reminder' })
  const { events, loading } = useAllEvents()
  const eventsByReminder = useMemo(() => groupByReminder(events), [events])

  if (loading) return <Loading />
  if (reminders.length === 0) return <Empty>Noch keine Reminder.</Empty>

  return (
    <div className="flex flex-col gap-3">
      {reminders.map((reminder) => {
        const reminderEvents = eventsByReminder.get(reminder.id) ?? []
        const completed = completedCount(reminderEvents)
        const avgGap = averageDaysBetweenCompletions(reminderEvents)
        const summary = completionSummary(reminderEvents)
        return (
          <article
            key={reminder.id}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <header className="flex items-center gap-3">
              <span className="text-xl" aria-hidden>
                {reminder.icon}
              </span>
              <h2 className="font-medium">{reminder.title}</h2>
            </header>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Metric label="Erledigt insgesamt" value={String(completed)} />
              <Metric
                label="30-Tage-Quote"
                value={`${Math.round(summary.last30.rate * 100)} %`}
              />
              <Metric
                label="Ø Abstand"
                value={
                  avgGap === null ? '—' : `${avgGap.toFixed(1)} d`
                }
              />
              <Metric
                label="Letzte Erledigung"
                value={lastCompletionLabel(reminderEvents)}
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}

const MOOD_WINDOW_DAYS = 30

function MoodStats() {
  const [now] = useState(() => Date.now())
  const fromMs = now - MOOD_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const { entries, loading } = useMoodEntriesInRange(fromMs, now)
  const { reminders: habits } = useReminders({ kind: 'habit' })
  const { events } = useAllEvents()

  const overview = useMemo(
    () => moodOverview(entries, MOOD_WINDOW_DAYS),
    [entries],
  )
  const series = useMemo(
    () => dailyMoodSeries(entries, MOOD_WINDOW_DAYS),
    [entries],
  )
  const weekday = useMemo(() => moodByWeekday(entries), [entries])
  const tags = useMemo(() => tagRollup(entries), [entries])
  const correlations = useMemo(
    () => habitMoodCorrelations(habits, events, entries),
    [habits, events, entries],
  )

  if (loading) return <Loading />
  if (entries.length === 0) {
    return (
      <Empty>Noch keine Mood-Einträge in den letzten {MOOD_WINDOW_DAYS} Tagen.</Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Einträge" value={String(overview.count)} />
        <Metric
          label="Ø Mood"
          value={overview.avgMood?.toFixed(2) ?? '—'}
        />
        <Metric
          label="Bester Tag"
          value={
            overview.bestDay
              ? `${overview.bestDay.day} (${overview.bestDay.avg.toFixed(1)})`
              : '—'
          }
        />
        <Metric
          label="Schlechtester Tag"
          value={
            overview.worstDay
              ? `${overview.worstDay.day} (${overview.worstDay.avg.toFixed(1)})`
              : '—'
          }
        />
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Verlauf (30 Tage)
        </h2>
        <Sparkline
          data={series.map((p) => ({ label: p.day, value: p.avgMood }))}
          ariaLabel="Mood-Verlauf"
        />
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Ø Mood pro Wochentag
        </h2>
        <WeekdayBar
          data={weekday.map((p) => ({
            label: p.label,
            value: p.avgMood,
            count: p.count,
          }))}
        />
      </section>

      {tags.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
            Tags
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {tags.slice(0, 8).map((tag) => (
              <li
                key={tag.tag}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 py-1 last:border-b-0 dark:border-zinc-800"
              >
                <span className="font-mono">{tag.tag}</span>
                <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                  {tag.count}× · Ø {tag.avgMood.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CorrelationInsights correlations={correlations} />
    </div>
  )
}

function CorrelationInsights({
  correlations,
}: {
  correlations: ReturnType<typeof habitMoodCorrelations>
}) {
  const meaningful = correlations
    .filter((c) => c.r !== null && Math.abs(c.r) > 0.3 && c.pairs >= 4)
    .sort((a, b) => Math.abs(b.r ?? 0) - Math.abs(a.r ?? 0))

  if (meaningful.length === 0) return null

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium uppercase text-zinc-500 dark:text-zinc-400">
          Was wirkt auf deine Stimmung?
        </h2>
        <span className="text-xs text-zinc-400">aus den letzten 30 Tagen</span>
      </header>
      <ul className="flex flex-col gap-2">
        {meaningful.map((c) => {
          const positive = (c.r ?? 0) > 0
          const intensity = Math.abs(c.r ?? 0)
          return (
            <li
              key={c.habitId}
              className={
                'flex items-start gap-3 rounded-md border-l-4 p-3 ' +
                (positive
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-rose-500 bg-rose-50 dark:bg-rose-950/30')
              }
            >
              <span className="text-2xl" aria-hidden>
                {c.habitIcon}
              </span>
              <div className="flex flex-col gap-0.5 text-sm">
                <p
                  className={
                    positive
                      ? 'text-emerald-900 dark:text-emerald-100'
                      : 'text-rose-900 dark:text-rose-100'
                  }
                >
                  An Tagen mit <strong>{c.habitTitle}</strong> warst du im
                  Schnitt{' '}
                  <strong>
                    {(intensity * 1.5).toFixed(1)} Punkte{' '}
                    {positive ? 'glücklicher' : 'gestresster'}
                  </strong>
                  .
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {c.pairs} überlappende Tage · Stärke{' '}
                  {intensity > 0.6 ? 'stark' : 'mittel'}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
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

function Loading() {
  return <p className="text-sm text-zinc-500">Lade …</p>
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {children}
    </p>
  )
}

function groupByReminder(
  events: readonly ReminderEvent[],
): Map<string, ReminderEvent[]> {
  const map = new Map<string, ReminderEvent[]>()
  for (const event of events) {
    const list = map.get(event.reminderId) ?? []
    list.push(event)
    map.set(event.reminderId, list)
  }
  return map
}

function buildHeatmapValues(
  events: readonly ReminderEvent[],
): Map<string, number | null> {
  const counts = new Map<string, number>()
  for (const event of events) {
    if (event.action !== 'completed') continue
    const ts = event.triggeredAt ?? event.scheduledFor
    if (ts == null) continue
    const key = dayKeyForDate(new Date(ts))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const max = Math.max(1, ...counts.values())
  const out = new Map<string, number | null>()
  for (const [key, count] of counts) {
    out.set(key, count / max)
  }
  return out
}

function lastCompletionLabel(events: readonly ReminderEvent[]): string {
  const stamps = events
    .filter((e) => e.action === 'completed')
    .map((e) => e.triggeredAt ?? e.scheduledFor)
    .filter((ts): ts is number => ts != null)
  if (stamps.length === 0) return '—'
  const latest = Math.max(...stamps)
  return formatRelativeDate(new Date(latest))
}
