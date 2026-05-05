import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReminders } from '../lib/hooks/useReminders'
import { deleteReminder, setReminderActive } from '../lib/db/reminders'
import { formatSchedule } from '../lib/format'
import type { Reminder, ReminderKind } from '../lib/types'

type Filter = 'all' | ReminderKind

export function AllPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const { reminders, loading } = useReminders({
    kind: filter === 'all' ? undefined : filter,
  })

  async function handleDelete(reminder: Reminder) {
    if (!confirm(`„${reminder.title}" wirklich löschen?`)) return
    await deleteReminder(reminder.id)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Alle</h1>
        <button
          type="button"
          onClick={() => navigate('/new')}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Neu
        </button>
      </header>

      <div role="tablist" aria-label="Filter" className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          Alle
        </FilterButton>
        <FilterButton
          active={filter === 'reminder'}
          onClick={() => setFilter('reminder')}
        >
          Erinnerungen
        </FilterButton>
        <FilterButton
          active={filter === 'habit'}
          onClick={() => setFilter('habit')}
        >
          Habits
        </FilterButton>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Lade …</p>
      ) : reminders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Nichts gefunden.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-2xl" aria-hidden>
                {reminder.icon}
              </span>
              <div className="flex flex-1 flex-col">
                <span className="font-medium">{reminder.title}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatSchedule(reminder.schedule)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReminderActive(reminder.id, !reminder.active)}
                className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {reminder.active ? 'Aktiv' : 'Pausiert'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/detail/${reminder.id}`)}
                className="rounded-md px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => navigate(`/edit/${reminder.id}`)}
                className="rounded-md px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => handleDelete(reminder)}
                className="rounded-md px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Löschen
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterButton({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium ' +
        (active
          ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50'
          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100')
      }
    >
      {children}
    </button>
  )
}
