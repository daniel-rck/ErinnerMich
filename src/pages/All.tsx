import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MoreVertical, Search } from 'lucide-react'
import { useReminders } from '../lib/hooks/useReminders'
import {
  archiveReminder,
  deleteReminder,
  restoreReminder,
  setReminderActive,
} from '../lib/db/reminders'
import { formatSchedule } from '../lib/format'
import { categoryClasses } from '../lib/categoryColors'
import { useToast } from '../components/ui/Toast'
import { CardSkeleton } from '../components/ui/CardSkeleton'
import type { Reminder, ReminderKind } from '../lib/types'

type Filter = 'all' | ReminderKind

const DELETE_GRACE_MS = 5500

export function AllPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const filter: Filter = (() => {
    const f = params.get('filter')
    return f === 'reminder' || f === 'habit' || f === 'mood' ? f : 'all'
  })()
  const search = params.get('q') ?? ''
  const { reminders, loading } = useReminders({
    kind: filter === 'all' ? undefined : filter,
  })

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q.length === 0) return reminders
    return reminders.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q),
    )
  }, [reminders, search])

  function setFilter(next: Filter) {
    const np = new URLSearchParams(params)
    if (next === 'all') np.delete('filter')
    else np.set('filter', next)
    setParams(np, { replace: true })
  }

  function setSearch(next: string) {
    const np = new URLSearchParams(params)
    if (next.length === 0) np.delete('q')
    else np.set('q', next)
    setParams(np, { replace: true })
  }

  async function handleDelete(reminder: Reminder) {
    await archiveReminder(reminder.id)
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      void deleteReminder(reminder.id)
    }, DELETE_GRACE_MS)
    toast.show({
      variant: 'success',
      message: `„${reminder.title}" gelöscht`,
      action: {
        label: 'Rückgängig',
        onClick: () => {
          cancelled = true
          clearTimeout(timer)
          void restoreReminder(reminder.id)
        },
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Alle</h1>
        <button
          type="button"
          onClick={() => navigate('/new')}
          className="hidden rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 sm:inline-flex"
        >
          + Neu
        </button>
      </header>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Search size={16} className="text-zinc-400" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen …"
          aria-label="Suchen"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm focus:outline-none"
        />
      </div>

      <div
        role="tablist"
        aria-label="Filter"
        className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
      >
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
        <FilterButton
          active={filter === 'mood'}
          onClick={() => setFilter('mood')}
        >
          Mood
        </FilterButton>
      </div>

      {loading ? (
        <CardSkeleton variant="row" count={4} />
      ) : visible.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <ul role="tabpanel" className="flex flex-col gap-2">
          {visible.map((reminder) => (
            <RowItem
              key={reminder.id}
              reminder={reminder}
              onOpen={() => navigate(`/detail/${reminder.id}`)}
              onEdit={() => navigate(`/edit/${reminder.id}`)}
              onToggleActive={() =>
                setReminderActive(reminder.id, !reminder.active)
              }
              onDelete={() => handleDelete(reminder)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyState({ search }: { search: string }) {
  if (search.trim().length > 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Keine Treffer für „{search}".
      </p>
    )
  }
  return (
    <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      Hier landen alle Reminder, Habits und Mood-Einträge.
    </p>
  )
}

function RowItem({
  reminder,
  onOpen,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  reminder: Reminder
  onOpen: () => void
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}) {
  const tone = categoryClasses(reminder.category)

  return (
    <li
      className={`flex items-center gap-3 rounded-lg border border-l-4 ${tone.borderL} border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-center gap-3 text-left no-min-tap"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone.iconBg} text-xl`}
          aria-hidden
        >
          {reminder.icon}
        </span>
        <div className="flex flex-1 flex-col">
          <span className="font-medium">{reminder.title}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatSchedule(reminder.schedule)}
            {!reminder.active && ' · pausiert'}
          </span>
        </div>
      </button>
      <RowMenu
        active={reminder.active}
        onToggleActive={onToggleActive}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </li>
  )
}

function RowMenu({
  active,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  active: boolean
  onToggleActive: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(action: () => void) {
    return () => {
      setOpen(false)
      action()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Optionen"
        className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 flex min-w-[10rem] flex-col rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        >
          <button
            type="button"
            role="menuitem"
            onClick={pick(onToggleActive)}
            className="px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            {active ? 'Pausieren' : 'Aktivieren'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onEdit)}
            className="px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Bearbeiten
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onDelete)}
            className="px-3 py-1.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Löschen
          </button>
        </div>
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
