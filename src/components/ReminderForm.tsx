import { useState } from 'react'
import type {
  HabitGoal,
  Reminder,
  ReminderKind,
  Schedule,
  Weekday,
} from '../lib/types'
import { createReminder, updateReminder } from '../lib/db/reminders'
import { formatSchedule } from '../lib/format'
import type { Template } from '../lib/templates'
import { ensureNotificationPermission } from '../lib/notifications/permission'
import {
  readSettings,
  writeNotificationOnboardingDone,
} from '../lib/db/settings'

const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: 'MON', label: 'Mo' },
  { value: 'TUE', label: 'Di' },
  { value: 'WED', label: 'Mi' },
  { value: 'THU', label: 'Do' },
  { value: 'FRI', label: 'Fr' },
  { value: 'SAT', label: 'Sa' },
  { value: 'SUN', label: 'So' },
]

const EDITABLE_TYPES = [
  'interval',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'elapsed',
] as const
type EditableType = (typeof EDITABLE_TYPES)[number]

interface ReminderFormProps {
  initial?: Reminder
  template?: Template
  kind: ReminderKind
  onSaved: (reminder: Reminder) => void
  onCancel?: () => void
}

export function ReminderForm({
  initial,
  template,
  kind,
  onSaved,
  onCancel,
}: ReminderFormProps) {
  const [title, setTitle] = useState(initial?.title ?? template?.title ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? template?.icon ?? '⏰')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [schedule, setSchedule] = useState<Schedule>(
    initial?.schedule ?? template?.defaultSchedule ?? { type: 'daily', times: ['09:00'] },
  )
  const [goal, setGoal] = useState<HabitGoal | undefined>(
    initial?.goal ?? template?.defaultGoal ?? (kind === 'habit' ? { type: 'binary' } : undefined),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReadOnlySchedule = !EDITABLE_TYPES.includes(
    schedule.type as EditableType,
  )

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Titel darf nicht leer sein')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (initial) {
        const updated = await updateReminder(initial.id, {
          title: title.trim(),
          icon,
          description: description.trim() || undefined,
          schedule,
          goal: kind === 'habit' ? goal : undefined,
        })
        onSaved(updated)
      } else {
        const created = await createReminder({
          kind,
          title: title.trim(),
          icon,
          description: description.trim() || undefined,
          category: template?.category ?? 'other',
          color: template?.color ?? 'emerald',
          schedule,
          goal: kind === 'habit' ? goal : undefined,
          streakSensitive: kind === 'habit',
          active: true,
        })
        if (!readSettings().notificationOnboardingDone) {
          const result = await ensureNotificationPermission()
          if (result === 'granted') writeNotificationOnboardingDone(true)
        }
        onSaved(created)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <FieldGroup label="Symbol" className="w-24">
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className={inputClass}
            maxLength={4}
            aria-label="Symbol oder Emoji"
          />
        </FieldGroup>
        <FieldGroup label="Titel" className="flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            required
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Notiz (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          rows={2}
        />
      </FieldGroup>

      {kind === 'habit' && (
        <FieldGroup label="Ziel">
          <HabitGoalEditor goal={goal} onChange={setGoal} />
        </FieldGroup>
      )}

      <FieldGroup label="Wiederholung">
        {isReadOnlySchedule ? (
          <div className="rounded-md border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            {formatSchedule(schedule)} — wird in einer späteren Version
            editierbar.
          </div>
        ) : (
          <ScheduleEditor schedule={schedule} onChange={setSchedule} />
        )}
      </FieldGroup>

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {initial ? 'Speichern' : 'Anlegen'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  )
}

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900'

function FieldGroup({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: Schedule
  onChange: (s: Schedule) => void
}) {
  function pickType(type: EditableType) {
    onChange(defaultForType(type))
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={schedule.type}
        onChange={(e) => pickType(e.target.value as EditableType)}
        className={inputClass}
      >
        <option value="daily">Täglich</option>
        <option value="weekly">Wöchentlich</option>
        <option value="monthly">Monatlich</option>
        <option value="yearly">Jährlich</option>
        <option value="elapsed">Alle X Tage</option>
        <option value="interval">Intervall (Minuten)</option>
      </select>

      {schedule.type === 'daily' && (
        <DailyEditor schedule={schedule} onChange={onChange} />
      )}
      {schedule.type === 'weekly' && (
        <WeeklyEditor schedule={schedule} onChange={onChange} />
      )}
      {schedule.type === 'monthly' && (
        <MonthlyEditor schedule={schedule} onChange={onChange} />
      )}
      {schedule.type === 'yearly' && (
        <YearlyEditor schedule={schedule} onChange={onChange} />
      )}
      {schedule.type === 'elapsed' && (
        <ElapsedEditor schedule={schedule} onChange={onChange} />
      )}
      {schedule.type === 'interval' && (
        <IntervalEditor schedule={schedule} onChange={onChange} />
      )}
    </div>
  )
}

function defaultForType(type: EditableType): Schedule {
  switch (type) {
    case 'daily':
      return { type: 'daily', times: ['09:00'] }
    case 'weekly':
      return { type: 'weekly', days: ['MON'], time: '09:00' }
    case 'monthly':
      return { type: 'monthly', dayOfMonth: 1, time: '09:00' }
    case 'yearly':
      return { type: 'yearly', month: 1, day: 1, time: '09:00' }
    case 'elapsed':
      return { type: 'elapsed', days: 7 }
    case 'interval':
      return { type: 'interval', minutes: 90 }
  }
}

function DailyEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: 'daily' }>
  onChange: (s: Schedule) => void
}) {
  return (
    <input
      type="text"
      value={schedule.times.join(', ')}
      onChange={(e) =>
        onChange({
          ...schedule,
          times: e.target.value
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        })
      }
      placeholder="08:00, 20:00"
      className={inputClass}
    />
  )
}

function WeeklyEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: 'weekly' }>
  onChange: (s: Schedule) => void
}) {
  function toggleDay(day: Weekday) {
    const days = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day]
    onChange({ ...schedule, days })
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {WEEKDAY_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleDay(value)}
            className={
              'rounded-md border px-3 py-1.5 text-sm ' +
              (schedule.days.includes(value)
                ? 'border-brand-500 bg-brand-100 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100'
                : 'border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800')
            }
          >
            {label}
          </button>
        ))}
      </div>
      <input
        type="time"
        value={schedule.time}
        onChange={(e) => onChange({ ...schedule, time: e.target.value })}
        className={inputClass}
      />
    </div>
  )
}

function MonthlyEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: 'monthly' }>
  onChange: (s: Schedule) => void
}) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        min={1}
        max={31}
        value={schedule.dayOfMonth}
        onChange={(e) =>
          onChange({ ...schedule, dayOfMonth: Number(e.target.value) })
        }
        className={inputClass}
        aria-label="Tag im Monat"
      />
      <input
        type="time"
        value={schedule.time}
        onChange={(e) => onChange({ ...schedule, time: e.target.value })}
        className={inputClass}
      />
    </div>
  )
}

function YearlyEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: 'yearly' }>
  onChange: (s: Schedule) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="number"
        min={1}
        max={12}
        value={schedule.month}
        onChange={(e) =>
          onChange({ ...schedule, month: Number(e.target.value) })
        }
        className={inputClass}
        aria-label="Monat"
      />
      <input
        type="number"
        min={1}
        max={31}
        value={schedule.day}
        onChange={(e) =>
          onChange({ ...schedule, day: Number(e.target.value) })
        }
        className={inputClass}
        aria-label="Tag"
      />
      <input
        type="time"
        value={schedule.time}
        onChange={(e) => onChange({ ...schedule, time: e.target.value })}
        className={inputClass}
      />
      <input
        type="number"
        min={0}
        max={365}
        value={schedule.leadDays ?? 0}
        onChange={(e) =>
          onChange({
            ...schedule,
            leadDays: Number(e.target.value) || undefined,
          })
        }
        className={inputClass}
        aria-label="Vorlauf in Tagen"
        placeholder="Vorlauf in Tagen"
      />
    </div>
  )
}

function ElapsedEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: 'elapsed' }>
  onChange: (s: Schedule) => void
}) {
  return (
    <input
      type="number"
      min={1}
      value={schedule.days}
      onChange={(e) =>
        onChange({ ...schedule, days: Number(e.target.value) })
      }
      className={inputClass}
      aria-label="Tage zwischen Erinnerungen"
    />
  )
}

function IntervalEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: 'interval' }>
  onChange: (s: Schedule) => void
}) {
  return (
    <input
      type="number"
      min={1}
      value={schedule.minutes}
      onChange={(e) =>
        onChange({ ...schedule, minutes: Number(e.target.value) })
      }
      className={inputClass}
      aria-label="Minuten"
    />
  )
}

function HabitGoalEditor({
  goal,
  onChange,
}: {
  goal: HabitGoal | undefined
  onChange: (goal: HabitGoal) => void
}) {
  const type = goal?.type ?? 'binary'
  return (
    <div className="flex flex-col gap-2">
      <select
        value={type}
        onChange={(e) => {
          const nextType = e.target.value as HabitGoal['type']
          if (nextType === 'binary') onChange({ type: 'binary' })
          else if (nextType === 'count')
            onChange({ type: 'count', target: 8, unit: 'Stück' })
          else onChange({ type: 'duration', targetMinutes: 30 })
        }}
        className={inputClass}
      >
        <option value="binary">Erledigt / Nicht erledigt</option>
        <option value="count">Zähler (z.B. 8 Glas)</option>
        <option value="duration">Dauer (z.B. 30 min)</option>
      </select>
      {goal?.type === 'count' && (
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={goal.target}
            onChange={(e) =>
              onChange({ ...goal, target: Number(e.target.value) })
            }
            className={inputClass}
            aria-label="Ziel-Anzahl"
          />
          <input
            value={goal.unit}
            onChange={(e) => onChange({ ...goal, unit: e.target.value })}
            className={inputClass}
            placeholder="Einheit"
            aria-label="Einheit"
          />
        </div>
      )}
      {goal?.type === 'duration' && (
        <input
          type="number"
          min={1}
          value={goal.targetMinutes}
          onChange={(e) =>
            onChange({ ...goal, targetMinutes: Number(e.target.value) })
          }
          className={inputClass}
          aria-label="Ziel-Minuten"
        />
      )}
    </div>
  )
}
