import { useMemo, useState } from 'react'
import { useReminders } from '../lib/hooks/useReminders'
import { useAllEvents } from '../lib/hooks/useAllEvents'
import { useMoodEntriesInRange } from '../lib/hooks/useMoodEntries'
import { Heatmap } from '../components/charts/Heatmap'
import { WeekdayBar } from '../components/charts/WeekdayBar'
import { Sparkline } from '../components/charts/Sparkline'
import { Tabs } from '../components/ui/Tabs'
import { Card } from '../components/ui/Card'
import { StatTile } from '../components/ui/StatTile'
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
import { useToolEntries } from '../lib/hooks/useToolEntries'
import { TOOLS } from '../lib/tools/registry'
import { useSettings } from '../lib/hooks/useSettings'

type StatsTab = 'habits' | 'reminders' | 'mood' | 'tools'

interface StatsPageProps {
  embedded?: boolean
}

export function StatsPage({ embedded = false }: StatsPageProps = {}) {
  const [tab, setTab] = useState<StatsTab>('habits')
  const { wellnessToolsEnabled } = useSettings()

  return (
    <div className="flex flex-col gap-[var(--space-lg)]">
      {!embedded && (
        <header className="flex flex-col gap-[var(--space-2xs)]">
          <p className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
            Du
          </p>
          <h1 className="text-[length:var(--text-display)] font-semibold leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
            Statistik
          </h1>
        </header>
      )}

      <Tabs value={tab} onChange={(v) => setTab(v as StatsTab)}>
        <Tabs.List ariaLabel="Statistik-Bereiche">
          <Tabs.Trigger value="habits">Habits</Tabs.Trigger>
          <Tabs.Trigger value="reminders">Reminder</Tabs.Trigger>
          <Tabs.Trigger value="mood">Mood</Tabs.Trigger>
          {wellnessToolsEnabled && <Tabs.Trigger value="tools">Tools</Tabs.Trigger>}
        </Tabs.List>
        <div className="mt-[var(--space-md)]">
          <Tabs.Panel value="habits">
            <HabitStats />
          </Tabs.Panel>
          <Tabs.Panel value="reminders">
            <ReminderStats />
          </Tabs.Panel>
          <Tabs.Panel value="mood">
            <MoodStats />
          </Tabs.Panel>
          {wellnessToolsEnabled && (
            <Tabs.Panel value="tools">
              <ToolStats />
            </Tabs.Panel>
          )}
        </div>
      </Tabs>
    </div>
  )
}

const TOOLS_WINDOW_DAYS = 30

function ToolStats() {
  const [now] = useState(() => Date.now())
  const since = now - TOOLS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const { entries, loading } = useToolEntries({ since })

  const byTool = useMemo(() => {
    const map = new Map<string, typeof entries>()
    for (const e of entries) {
      const list = map.get(e.toolKey) ?? []
      list.push(e)
      map.set(e.toolKey, list)
    }
    return map
  }, [entries])

  if (loading) return <Loading />
  if (entries.length === 0) {
    return <Empty>Noch keine Tool-Sessions in den letzten {TOOLS_WINDOW_DAYS} Tagen.</Empty>
  }

  return (
    <div className="flex flex-col gap-[var(--space-md)]">
      {TOOLS.map((tool) => {
        const list = byTool.get(tool.key) ?? []
        if (list.length === 0) return null
        const heatmap = buildToolHeatmap(list.map((e) => e.loggedAt))
        return (
          <Card key={tool.key} variant="raised" radius="lg" padding="md">
            <header className="mb-[var(--space-sm)] flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {tool.icon}
              </span>
              <h2 className="text-[length:var(--text-title-3)] font-semibold text-[color:var(--color-text-primary)]">
                {tool.title}
              </h2>
              <span className="ml-auto text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
                {list.length} {list.length === 1 ? 'Session' : 'Sessions'}
              </span>
            </header>
            <Heatmap values={heatmap} ariaLabel={`Heatmap für ${tool.title}`} />
          </Card>
        )
      })}
    </div>
  )
}

function buildToolHeatmap(
  timestamps: readonly number[],
): Map<string, number | null> {
  const counts = new Map<string, number>()
  for (const ts of timestamps) {
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

function HabitStats() {
  const { reminders } = useReminders({ kind: 'habit' })
  const { events, loading } = useAllEvents()

  const eventsByReminder = useMemo(() => groupByReminder(events), [events])

  if (loading) return <Loading />
  if (reminders.length === 0) return <Empty>Noch keine Habits.</Empty>

  return (
    <div className="flex flex-col gap-[var(--space-md)]">
      {reminders.map((habit) => {
        const habitEvents = eventsByReminder.get(habit.id) ?? []
        const streak = streakStats(habitEvents)
        const freeze = currentStreakWithFreeze(habitEvents)
        const summary = completionSummary(habitEvents)
        const heatmapValues = buildHeatmapValues(habitEvents)
        return (
          <Card key={habit.id} variant="raised" radius="lg" padding="md">
            <header className="mb-[var(--space-sm)] flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {habit.icon}
              </span>
              <h2 className="text-[length:var(--text-title-3)] font-semibold text-[color:var(--color-text-primary)]">
                {habit.title}
              </h2>
            </header>
            <div className="mb-[var(--space-md)] grid grid-cols-2 gap-[var(--space-xs)] sm:grid-cols-4">
              <StatTile label="Streak" value={`${streak.current}d`} accent="glow" size="sm" />
              <StatTile
                label="Mit Freeze"
                value={
                  freeze.freezesUsed > 0
                    ? `${freeze.length}d ❄${freeze.freezesUsed}`
                    : `${freeze.length}d`
                }
                accent="calm"
                size="sm"
              />
              <StatTile label="Längste" value={`${streak.longest}d`} accent="brand" size="sm" />
              <StatTile
                label="30-Tage"
                value={`${Math.round(summary.last30.rate * 100)}%`}
                accent="grow"
                size="sm"
              />
            </div>
            <Heatmap values={heatmapValues} ariaLabel={`Heatmap für ${habit.title}`} />
          </Card>
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
    <div className="flex flex-col gap-[var(--space-sm)]">
      {reminders.map((reminder) => {
        const reminderEvents = eventsByReminder.get(reminder.id) ?? []
        const completed = completedCount(reminderEvents)
        const avgGap = averageDaysBetweenCompletions(reminderEvents)
        const summary = completionSummary(reminderEvents)
        return (
          <Card key={reminder.id} variant="raised" radius="lg" padding="md">
            <header className="mb-[var(--space-sm)] flex items-center gap-3">
              <span className="text-xl" aria-hidden>
                {reminder.icon}
              </span>
              <h2 className="text-[length:var(--text-title-3)] font-semibold text-[color:var(--color-text-primary)]">
                {reminder.title}
              </h2>
            </header>
            <div className="grid grid-cols-2 gap-[var(--space-xs)] sm:grid-cols-4">
              <StatTile label="Erledigt" value={completed} accent="grow" size="sm" />
              <StatTile
                label="30-Tage"
                value={`${Math.round(summary.last30.rate * 100)}%`}
                accent="brand"
                size="sm"
              />
              <StatTile
                label="Ø Abstand"
                value={avgGap === null ? '—' : `${avgGap.toFixed(1)}d`}
                accent="calm"
                size="sm"
              />
              <StatTile
                label="Zuletzt"
                value={lastCompletionLabel(reminderEvents)}
                accent="glow"
                size="sm"
              />
            </div>
          </Card>
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

  const overview = useMemo(() => moodOverview(entries, MOOD_WINDOW_DAYS), [entries])
  const series = useMemo(() => dailyMoodSeries(entries, MOOD_WINDOW_DAYS), [entries])
  const weekday = useMemo(() => moodByWeekday(entries), [entries])
  const tags = useMemo(() => tagRollup(entries), [entries])
  const correlations = useMemo(
    () => habitMoodCorrelations(habits, events, entries),
    [habits, events, entries],
  )

  if (loading) return <Loading />
  if (entries.length === 0) {
    return <Empty>Noch keine Mood-Einträge in den letzten {MOOD_WINDOW_DAYS} Tagen.</Empty>
  }

  return (
    <div className="flex flex-col gap-[var(--space-md)]">
      <section className="grid grid-cols-2 gap-[var(--space-xs)] sm:grid-cols-4">
        <StatTile label="Einträge" value={overview.count} accent="brand" size="sm" />
        <StatTile
          label="Ø Mood"
          value={overview.avgMood?.toFixed(2) ?? '—'}
          accent="mood"
          size="sm"
        />
        <StatTile
          label="Bester Tag"
          value={
            overview.bestDay ? `${overview.bestDay.day} · ${overview.bestDay.avg.toFixed(1)}` : '—'
          }
          accent="grow"
          size="sm"
        />
        <StatTile
          label="Schlechtester"
          value={
            overview.worstDay
              ? `${overview.worstDay.day} · ${overview.worstDay.avg.toFixed(1)}`
              : '—'
          }
          accent="glow"
          size="sm"
        />
      </section>

      <Card variant="raised" radius="lg" padding="md">
        <h2 className="mb-[var(--space-xs)] text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          Verlauf (30 Tage)
        </h2>
        <Sparkline
          data={series.map((p) => ({ label: p.day, value: p.avgMood }))}
          ariaLabel="Mood-Verlauf"
        />
      </Card>

      <Card variant="raised" radius="lg" padding="md">
        <h2 className="mb-[var(--space-xs)] text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          Ø Mood pro Wochentag
        </h2>
        <WeekdayBar
          data={weekday.map((p) => ({ label: p.label, value: p.avgMood, count: p.count }))}
        />
      </Card>

      {tags.length > 0 && (
        <Card variant="raised" radius="lg" padding="md">
          <h2 className="mb-[var(--space-xs)] text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
            Tags
          </h2>
          <ul className="flex flex-col gap-1 text-[length:var(--text-body)]">
            {tags.slice(0, 8).map((tag) => (
              <li
                key={tag.tag}
                className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border-subtle)] py-1 last:border-b-0"
              >
                <span className="font-mono text-[color:var(--color-text-primary)]">{tag.tag}</span>
                <span className="tabular-nums text-[color:var(--color-text-secondary)]">
                  {tag.count}× · Ø {tag.avgMood.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
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
    <Card variant="raised" radius="lg" padding="md">
      <header className="mb-[var(--space-sm)] flex items-baseline justify-between gap-3">
        <h2 className="text-[length:var(--text-title-3)] font-semibold text-[color:var(--color-text-primary)]">
          Was wirkt auf deine Stimmung?
        </h2>
        <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
          aus den letzten 30 Tagen
        </span>
      </header>
      <ul className="flex flex-col gap-[var(--space-xs)]">
        {meaningful.map((c) => {
          const positive = (c.r ?? 0) > 0
          const intensity = Math.abs(c.r ?? 0)
          return (
            <li
              key={c.habitId}
              className={[
                'flex items-start gap-3 rounded-[var(--radius-md)] border-l-4 p-[var(--space-sm)]',
                positive
                  ? 'border-l-[color:var(--color-success)] bg-[color:var(--color-success-soft)]'
                  : 'border-l-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]',
              ].join(' ')}
            >
              <span className="text-2xl" aria-hidden>
                {c.habitIcon}
              </span>
              <div className="flex flex-col gap-0.5 text-[length:var(--text-body)]">
                <p className="text-[color:var(--color-text-primary)]">
                  An Tagen mit <strong>{c.habitTitle}</strong> warst du im Schnitt{' '}
                  <strong>
                    {(intensity * 1.5).toFixed(1)} Punkte{' '}
                    {positive ? 'glücklicher' : 'gestresster'}
                  </strong>
                  .
                </p>
                <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
                  {c.pairs} überlappende Tage · Stärke{' '}
                  {intensity > 0.6 ? 'stark' : 'mittel'}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function Loading() {
  return <p className="text-[length:var(--text-body)] text-[color:var(--color-text-tertiary)]">Lade …</p>
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border-strong)] p-[var(--space-lg)] text-center text-[length:var(--text-body)] text-[color:var(--color-text-secondary)]">
      {children}
    </p>
  )
}

function groupByReminder(events: readonly ReminderEvent[]): Map<string, ReminderEvent[]> {
  const map = new Map<string, ReminderEvent[]>()
  for (const event of events) {
    const list = map.get(event.reminderId) ?? []
    list.push(event)
    map.set(event.reminderId, list)
  }
  return map
}

function buildHeatmapValues(events: readonly ReminderEvent[]): Map<string, number | null> {
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
