import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import autoAnimate from '@formkit/auto-animate'
import { useReminders } from '../lib/hooks/useReminders'
import { HabitCard } from '../components/HabitCard'
import { CardSkeleton } from '../components/ui/CardSkeleton'
import { HABIT_TEMPLATES } from '../lib/templates'
import { dayKey } from '../lib/db'

const SUGGESTED_KEYS = ['water', 'steps', 'meditate']

export function HabitsPage() {
  const navigate = useNavigate()
  const [today] = useState(() => dayKey(Date.now()))
  const { reminders, loading } = useReminders({
    kind: 'habit',
    activeOnly: true,
  })
  const gridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (gridRef.current) autoAnimate(gridRef.current)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        <button
          type="button"
          onClick={() => navigate('/new?kind=habit')}
          className="hidden rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 sm:inline-flex"
        >
          + Neu
        </button>
      </header>

      {loading ? (
        <CardSkeleton count={3} />
      ) : reminders.length === 0 ? (
        <HabitsEmpty />
      ) : (
        <div ref={gridRef} className="grid gap-3 sm:grid-cols-2">
          {reminders.map((reminder) => (
            <HabitCard key={reminder.id} reminder={reminder} today={today} />
          ))}
        </div>
      )}
    </div>
  )
}

function HabitsEmpty() {
  const navigate = useNavigate()
  const suggested = HABIT_TEMPLATES.filter((t) =>
    SUGGESTED_KEYS.includes(t.key),
  ).slice(0, 3)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
      <div>
        <p className="text-base font-medium">Erste Habit anlegen</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Wähle eine Vorlage oder lege selbst etwas an.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {suggested.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => navigate(`/new?kind=habit&title=${encodeURIComponent(t.title)}`)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:border-brand-400 hover:bg-brand-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-brand-500 dark:hover:bg-brand-950/40"
          >
            <span aria-hidden>{t.icon}</span>
            {t.title}
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigate('/new?kind=habit')}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Alle Vorlagen
        </button>
      </div>
    </div>
  )
}
