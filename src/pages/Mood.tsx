import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LifeBuoy, ArrowRight, TrendingUp } from 'lucide-react'
import { MoodStrip } from '../components/MoodStrip'
import { TodayAffirmation } from '../components/TodayAffirmation'
import { Sheet } from '../components/ui/Sheet'
import { Card } from '../components/ui/Card'
import { Sparkline } from '../components/charts/Sparkline'
import { WeekdayBar } from '../components/charts/WeekdayBar'
import { useMoodEntriesInRange } from '../lib/hooks/useMoodEntries'
import { useToolEntries } from '../lib/hooks/useToolEntries'
import { useSettings } from '../lib/hooks/useSettings'
import { TOOLS } from '../lib/tools/registry'
import { dailyMoodSeries, moodByWeekday } from '../lib/stats/moodAggregates'
import { dayKey } from '../lib/db'
import { FADE_UP, STAGGER_CONTAINER } from '../lib/design/motion'
import type { ToolDef, ToolCategory } from '../lib/tools/registry'

const ACCENT_GRADIENT: Record<ToolCategory, string> = {
  acute: 'from-[color:var(--color-accent-calm-soft)] to-[color:var(--color-accent-grow-soft)]',
  reflection: 'from-[color:var(--color-accent-mood-soft)] to-[color:var(--color-accent-glow-soft)]',
}

export function MoodPage() {
  const navigate = useNavigate()
  const settings = useSettings()
  const [sosOpen, setSosOpen] = useState(false)

  const [now] = useState(() => Date.now())
  const fromMs = useMemo(() => now - 7 * 24 * 60 * 60 * 1000, [now])
  const { entries } = useMoodEntriesInRange(fromMs, now)

  const series = useMemo(() => dailyMoodSeries(entries, 7), [entries])
  const sparklineData = useMemo(
    () => series.map((p) => ({ label: p.day.slice(-5), value: p.avgMood })),
    [series],
  )
  const weekday = useMemo(
    () =>
      moodByWeekday(entries).map((p) => ({
        label: p.label,
        value: p.avgMood,
        count: p.count,
      })),
    [entries],
  )

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={STAGGER_CONTAINER}
      className="flex flex-col gap-[var(--space-lg)]"
    >
      <motion.header variants={FADE_UP} className="flex flex-col gap-[var(--space-2xs)]">
        <p className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          Stimmung &amp; Wellness
        </p>
        <h1 className="text-[length:var(--text-display)] font-semibold leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
          Wie geht's dir?
        </h1>
      </motion.header>

      <motion.section variants={FADE_UP}>
        <MoodStrip alwaysExpanded />
      </motion.section>

      <motion.section variants={FADE_UP}>
        <Card variant="raised" radius="lg" padding="md" as="section">
          <div className="mb-[var(--space-sm)] flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-[length:var(--text-title-3)] font-semibold text-[color:var(--color-text-primary)]">
                7 Tage
              </h2>
              <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
                Tagesdurchschnitt deiner Stimmung
              </p>
            </div>
            <Link
              to="/stats"
              aria-label="Zur Stimmungs-Statistik"
              className="inline-flex items-center gap-1 text-[length:var(--text-caption)] font-medium text-[color:var(--color-brand-600)] hover:underline no-min-tap"
            >
              <TrendingUp size={14} aria-hidden />
              Stats
            </Link>
          </div>
          {entries.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border-strong)] p-[var(--space-md)] text-center text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
              Noch keine Einträge. Tippe oben auf einen Smiley.
            </p>
          ) : (
            <div className="flex flex-col gap-[var(--space-sm)]">
              <div className="h-16">
                <Sparkline data={sparklineData} ariaLabel="Stimmung 7 Tage" />
              </div>
              <WeekdayBar data={weekday} ariaLabel="Stimmung nach Wochentag" />
            </div>
          )}
        </Card>
      </motion.section>

      {settings.wellnessToolsEnabled && (
        <>
          <motion.section variants={FADE_UP}>
            <TodayAffirmation />
          </motion.section>

          <motion.section variants={FADE_UP} className="flex flex-col gap-[var(--space-sm)]">
            <header className="flex items-center justify-between">
              <h2 className="text-[length:var(--text-title-2)] font-semibold text-[color:var(--color-text-primary)]">
                Akut
              </h2>
              <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
                Wenn's gerade zu viel ist
              </span>
            </header>
            <div className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2">
              {TOOLS.filter((t) => t.category === 'acute').map((t) => (
                <ToolCard key={t.key} tool={t} />
              ))}
            </div>
          </motion.section>

          <motion.section variants={FADE_UP} className="flex flex-col gap-[var(--space-sm)]">
            <header className="flex items-center justify-between">
              <h2 className="text-[length:var(--text-title-2)] font-semibold text-[color:var(--color-text-primary)]">
                Reflexion
              </h2>
              <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
                In Ruhe nachspüren
              </span>
            </header>
            <div className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2">
              {TOOLS.filter((t) => t.category === 'reflection').map((t) => (
                <ToolCard key={t.key} tool={t} />
              ))}
            </div>
          </motion.section>

          <motion.section variants={FADE_UP}>
            <button
              type="button"
              onClick={() => setSosOpen(true)}
              className={[
                'group flex w-full items-center gap-[var(--space-md)]',
                'rounded-[var(--radius-lg)] p-[var(--space-md)]',
                'bg-gradient-to-br from-[color:var(--color-danger-soft)] to-[color:var(--color-accent-mood-soft)]',
                'border border-[color:var(--color-danger)]/30',
                'transition-shadow duration-[var(--motion-base)]',
                'hover:shadow-[var(--elev-2)]',
              ].join(' ')}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-elevated)] shadow-[var(--elev-1)]">
                <LifeBuoy size={20} aria-hidden className="text-[color:var(--color-danger)]" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h3 className="text-[length:var(--text-body)] font-semibold text-[color:var(--color-text-primary)]">
                  Brauchst du gerade Halt?
                </h3>
                <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
                  Drei Tools, die sofort helfen können.
                </p>
              </div>
              <ArrowRight
                size={18}
                aria-hidden
                className="shrink-0 text-[color:var(--color-text-tertiary)] transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </motion.section>
        </>
      )}

      <Sheet open={sosOpen} onClose={() => setSosOpen(false)} title="Was brauchst du gerade?">
        <ul className="flex flex-col gap-[var(--space-xs)] pb-[var(--space-md)]">
          {TOOLS.filter((t) => t.category === 'acute').map((tool) => (
            <li key={tool.key}>
              <button
                type="button"
                onClick={() => {
                  setSosOpen(false)
                  navigate(`/tools/${tool.key}`)
                }}
                className={[
                  'flex w-full items-center gap-3 rounded-[var(--radius-md)] p-[var(--space-sm)] text-left',
                  'bg-[color:var(--color-surface-sunken)]',
                  'hover:bg-[color:var(--color-border-subtle)]',
                ].join(' ')}
              >
                <span className="text-2xl" aria-hidden>
                  {tool.icon}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-[color:var(--color-text-primary)]">
                    {tool.title}
                  </span>
                  <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
                    {tool.blurb}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </motion.div>
  )
}

function ToolCard({ tool }: { tool: ToolDef }) {
  const { entries } = useToolEntries({ toolKey: tool.key })
  const [today] = useState(() => dayKey(Date.now()))
  const todayCount = useMemo(
    () => entries.filter((e) => dayKey(e.loggedAt) === today).length,
    [entries, today],
  )
  const totalCount = entries.length
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Link
        to={`/tools/${tool.key}`}
        className={[
          'flex items-center gap-3 rounded-[var(--radius-lg)] p-[var(--space-md)]',
          'bg-gradient-to-br border border-[color:var(--color-border-subtle)]',
          'shadow-[var(--elev-1)] hover:shadow-[var(--elev-2)]',
          'transition-shadow duration-[var(--motion-base)]',
          ACCENT_GRADIENT[tool.category],
        ].join(' ')}
      >
        <span className="text-3xl" aria-hidden>
          {tool.icon}
        </span>
        <div className="flex-1">
          <h3 className="text-[length:var(--text-body)] font-semibold text-[color:var(--color-text-primary)]">
            {tool.title}
          </h3>
          <p className="mt-0.5 text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
            {tool.blurb}
          </p>
          {totalCount > 0 && (
            <p className="mt-1 text-[length:var(--text-micro)] text-[color:var(--color-text-tertiary)]">
              {todayCount > 0 ? `Heute: ${todayCount} · ` : ''}
              gesamt: {totalCount}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

