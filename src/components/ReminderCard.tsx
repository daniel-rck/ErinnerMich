import type { Reminder } from '../lib/types'
import { addEvent } from '../lib/db/events'
import { updateReminder } from '../lib/db/reminders'
import { adjustInventory } from '../lib/db/inventories'
import { formatSchedule } from '../lib/format'

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
  async function complete() {
    const now = Date.now()
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
  }

  async function snooze(minutes: number) {
    const now = Date.now()
    await addEvent({
      reminderId: reminder.id,
      action: 'snoozed',
      triggeredAt: now,
      snoozeUntil: now + minutes * 60_000,
    })
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={complete}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Erledigt
        </button>
        <button
          type="button"
          onClick={() => snooze(30)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          +30 min
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(reminder)}
            className="ml-auto rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Bearbeiten
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(reminder)}
            className="rounded-md px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Löschen
          </button>
        )}
      </div>
    </article>
  )
}
