import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReminders } from '../lib/hooks/useReminders'
import { HabitCard } from '../components/HabitCard'
import { dayKey } from '../lib/db'

export function HabitsPage() {
  const navigate = useNavigate()
  const [today] = useState(() => dayKey(Date.now()))
  const { reminders, loading } = useReminders({
    kind: 'habit',
    activeOnly: true,
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        <button
          type="button"
          onClick={() => navigate('/new?kind=habit')}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Neu
        </button>
      </header>

      {loading ? (
        <p className="text-sm text-zinc-500">Lade …</p>
      ) : reminders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Noch keine Habits. Tippe auf „+ Neu“, um einen anzulegen.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {reminders.map((reminder) => (
            <HabitCard key={reminder.id} reminder={reminder} today={today} />
          ))}
        </div>
      )}
    </div>
  )
}
