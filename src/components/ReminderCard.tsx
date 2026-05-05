import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, Pencil, Trash2 } from 'lucide-react'
import type { Reminder } from '../lib/types'
import { addEvent } from '../lib/db/events'
import { updateReminder } from '../lib/db/reminders'
import { adjustInventory } from '../lib/db/inventories'
import { formatSchedule } from '../lib/format'
import { vibrate } from './ui/Haptic'
import { useToast } from './ui/Toast'

const SNOOZE_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 10, label: '+10 min' },
  { minutes: 30, label: '+30 min' },
  { minutes: 60, label: '+1 h' },
  { minutes: 24 * 60, label: '+1 Tag' },
]

interface ReminderCardProps {
  reminder: Reminder
  scheduledFor?: Date
  onEdit?: (reminder: Reminder) => void
  onDelete?: (reminder: Reminder) => void
}

export function ReminderCard({
  reminder,
  scheduledFor,
  onEdit,
  onDelete,
}: ReminderCardProps) {
  const toast = useToast()

  async function complete() {
    const now = Date.now()
    vibrate('success')
    await addEvent({
      reminderId: reminder.id,
      action: 'completed',
      triggeredAt: now,
      scheduledFor: scheduledFor?.getTime(),
    })
    if (reminder.schedule.type === 'elapsed') {
      await updateReminder(reminder.id, {
        schedule: { ...reminder.schedule, lastDone: now },
      })
    }
    if (reminder.kind === 'reminder') {
      await adjustInventory(reminder.id, -1)
    }
    toast.show({ variant: 'success', message: `„${reminder.title}" erledigt` })
  }

  async function snooze(minutes: number) {
    const now = Date.now()
    vibrate('tick')
    await addEvent({
      reminderId: reminder.id,
      action: 'snoozed',
      triggeredAt: now,
      scheduledFor: scheduledFor?.getTime(),
      snoozeUntil: now + minutes * 60_000,
    })
    toast.show({ message: `Erneut in ${formatSnooze(minutes)}` })
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {reminder.icon}
        </span>
        <div className="flex flex-1 flex-col">
          <h3 className="font-medium leading-tight">{reminder.title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatSchedule(reminder.schedule)}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          onClick={complete}
          whileTap={{ scale: 0.94 }}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Check size={14} />
          Erledigt
        </motion.button>
        <SnoozeMenu onSnooze={snooze} />
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(reminder)}
            aria-label="Bearbeiten"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">Bearbeiten</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(reminder)}
            aria-label="Löschen"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Löschen</span>
          </button>
        )}
      </div>
    </motion.article>
  )
}

function formatSnooze(minutes: number): string {
  if (minutes >= 24 * 60) return `${Math.round(minutes / (24 * 60))} Tagen`
  if (minutes >= 60) return `${Math.round(minutes / 60)} Std.`
  return `${minutes} min`
}

function SnoozeMenu({ onSnooze }: { onSnooze: (minutes: number) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const popoverId = useId()

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={popoverId}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <Clock size={14} />
        Snooze
      </button>
      {open && (
        <div
          id={popoverId}
          aria-label="Snooze-Optionen"
          className="absolute z-10 mt-1 flex min-w-[8rem] flex-col rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        >
          {SNOOZE_OPTIONS.map(({ minutes, label }) => (
            <button
              key={minutes}
              type="button"
              onClick={() => {
                onSnooze(minutes)
                setOpen(false)
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
