import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Flame, ChevronRight } from 'lucide-react'
import { useReminders } from '../lib/hooks/useReminders'
import { useAllEvents } from '../lib/hooks/useAllEvents'
import { addEvent } from '../lib/db/events'
import {
  currentStreak,
  successfulDayKeys,
} from '../lib/stats/streaks'
import { dayKey } from '../lib/db'
import { dayKeyForDate } from '../lib/stats/dayKey'
import { isMilestone } from '../lib/stats/streakMilestones'
import { vibrate } from './ui/Haptic'
import { Celebration } from './Celebration'
import type { Reminder, ReminderEvent } from '../lib/types'

interface HabitRailProps {
  /** Cap how many habits to render in the rail. Default 6. */
  limit?: number
}

export function HabitRail({ limit = 6 }: HabitRailProps) {
  const { reminders } = useReminders({ kind: 'habit', activeOnly: true })
  const { events } = useAllEvents()
  const [today] = useState(() => dayKey(Date.now()))
  const [celebrateStreak, setCelebrateStreak] = useState<number | null>(null)

  const eventsByReminder = useMemo(() => {
    const map = new Map<string, ReminderEvent[]>()
    for (const e of events) {
      const list = map.get(e.reminderId) ?? []
      list.push(e)
      map.set(e.reminderId, list)
    }
    return map
  }, [events])

  const items = useMemo(() => reminders.slice(0, limit), [reminders, limit])

  const bump = useCallback(
    async (reminder: Reminder) => {
      const habitEvents = eventsByReminder.get(reminder.id) ?? []
      const now = Date.now()
      const todayKey = dayKeyForDate(new Date(now))
      const wasTodayDone = successfulDayKeys(habitEvents).has(todayKey)
      const streakBefore = currentStreak(habitEvents, new Date(now))
      await addEvent({
        reminderId: reminder.id,
        action: 'completed',
        triggeredAt: now,
      })
      const newStreak = wasTodayDone ? streakBefore : streakBefore + 1
      if (!wasTodayDone && isMilestone(newStreak)) {
        vibrate('milestone')
        setCelebrateStreak(newStreak)
      } else {
        vibrate('tick')
      }
    },
    [eventsByReminder],
  )

  if (items.length === 0) return null

  return (
    <section
      aria-label="Habits"
      className="flex flex-col gap-[var(--space-sm)]"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-[length:var(--text-title-3)] font-semibold text-[color:var(--color-text-primary)]">
          Heutige Habits
        </h2>
        <Link
          to="/library"
          className="inline-flex items-center gap-1 text-[length:var(--text-caption)] font-medium text-[color:var(--color-brand-600)] hover:underline no-min-tap"
        >
          Alle
          <ChevronRight size={14} aria-hidden />
        </Link>
      </header>
      <ul
        className={[
          'flex gap-[var(--space-sm)] overflow-x-auto',
          'snap-x snap-mandatory',
          '-mx-[var(--space-md)] px-[var(--space-md)] pb-1',
          'scroll-pl-[var(--space-md)]',
        ].join(' ')}
      >
        {items.map((reminder) => {
          const habitEvents = eventsByReminder.get(reminder.id) ?? []
          const todayDone = successfulDayKeys(habitEvents).has(today)
          const streak = currentStreak(habitEvents, new Date())
          return (
            <li key={reminder.id} className="snap-start">
              <HabitMiniCard
                reminder={reminder}
                done={todayDone}
                streak={streak}
                onBump={() => void bump(reminder)}
              />
            </li>
          )
        })}
      </ul>

      <Celebration
        open={celebrateStreak != null}
        streak={celebrateStreak ?? 0}
        onClose={() => setCelebrateStreak(null)}
      />
    </section>
  )
}

interface HabitMiniCardProps {
  reminder: Reminder
  done: boolean
  streak: number
  onBump: () => void
}

function HabitMiniCard({ reminder, done, streak, onBump }: HabitMiniCardProps) {
  return (
    <article
      className={[
        'flex w-36 shrink-0 flex-col items-center gap-2',
        'rounded-[var(--radius-lg)] p-[var(--space-sm)]',
        'bg-[color:var(--color-surface-elevated)]',
        'border border-[color:var(--color-border-subtle)]',
        'shadow-[var(--elev-1)]',
      ].join(' ')}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-2xl leading-none" aria-hidden>
          {reminder.icon}
        </span>
        {streak > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded-full bg-[color:var(--color-warning-soft)] px-1.5 py-0.5 text-[length:var(--text-micro)] font-medium text-[color:var(--color-warning)]"
            aria-label={`${streak} Tage Streak`}
          >
            <Flame size={10} aria-hidden />
            {streak}
          </span>
        )}
      </div>
      <Link
        to={`/detail/${reminder.id}`}
        className="line-clamp-2 w-full text-center text-[length:var(--text-caption)] font-medium leading-tight text-[color:var(--color-text-primary)] no-min-tap"
      >
        {reminder.title}
      </Link>
      <motion.button
        type="button"
        onClick={onBump}
        whileTap={{ scale: 0.92 }}
        aria-label={`${reminder.title} +1`}
        className={[
          'mt-auto inline-flex items-center justify-center gap-1',
          'h-9 w-full rounded-[var(--radius-md)]',
          'text-[length:var(--text-caption)] font-medium',
          'transition-colors duration-[var(--motion-fast)]',
          done
            ? 'bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]'
            : 'bg-[color:var(--color-brand-600)] text-[color:var(--color-text-on-brand)] hover:bg-[color:var(--color-brand-700)]',
        ].join(' ')}
      >
        <Plus size={14} aria-hidden />
        {done ? 'Erledigt' : '+1'}
      </motion.button>
    </article>
  )
}
