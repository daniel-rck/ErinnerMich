import type { Reminder } from '../lib/types'
import { addEvent } from '../lib/db/events'
import { useDailyProgress } from '../lib/hooks/useEvents'

interface HabitCardProps {
  reminder: Reminder
  today: string
}

export function HabitCard({ reminder, today }: HabitCardProps) {
  const { completions, sum } = useDailyProgress(reminder.id, today)
  const goal = reminder.goal

  const { current, target, unit, ratio } = computeProgress(
    goal,
    completions,
    sum,
  )

  async function bump(value: number, action: 'completed' | 'progress') {
    const now = Date.now()
    if (action === 'completed') {
      await addEvent({
        reminderId: reminder.id,
        action: 'completed',
        triggeredAt: now,
      })
    } else {
      await addEvent({
        reminderId: reminder.id,
        action: 'progress',
        triggeredAt: now,
        progress: { value, unit: unit ?? '' },
      })
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-start gap-3">
        <ProgressRing ratio={ratio} icon={reminder.icon} />
        <div className="flex flex-1 flex-col">
          <h3 className="font-medium leading-tight">{reminder.title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {target !== undefined
              ? `${current} / ${target} ${unit ?? ''}`.trim()
              : current > 0
                ? 'Heute erledigt'
                : 'Noch nicht heute'}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {goal?.type === 'binary' && (
          <button
            type="button"
            onClick={() => bump(1, 'completed')}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            disabled={completions > 0}
          >
            {completions > 0 ? 'Erledigt' : 'Erledigt markieren'}
          </button>
        )}
        {goal?.type === 'count' && (
          <>
            <button
              type="button"
              onClick={() => bump(1, 'progress')}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              +1 {goal.unit}
            </button>
            <button
              type="button"
              onClick={() => bump(5, 'progress')}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              +5
            </button>
          </>
        )}
        {goal?.type === 'duration' && (
          <>
            <button
              type="button"
              onClick={() => bump(15, 'progress')}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              +15 min
            </button>
            <button
              type="button"
              onClick={() => bump(5, 'progress')}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              +5 min
            </button>
          </>
        )}
      </div>
    </article>
  )
}

function computeProgress(
  goal: Reminder['goal'],
  completions: number,
  sum: number,
): { current: number; target?: number; unit?: string; ratio: number } {
  if (!goal) {
    return { current: completions, ratio: completions > 0 ? 1 : 0 }
  }
  if (goal.type === 'binary') {
    return { current: completions, target: 1, ratio: completions > 0 ? 1 : 0 }
  }
  if (goal.type === 'count') {
    return {
      current: sum,
      target: goal.target,
      unit: goal.unit,
      ratio: Math.min(1, goal.target > 0 ? sum / goal.target : 0),
    }
  }
  return {
    current: sum,
    target: goal.targetMinutes,
    unit: 'min',
    ratio: Math.min(1, goal.targetMinutes > 0 ? sum / goal.targetMinutes : 0),
  }
}

function ProgressRing({ ratio, icon }: { ratio: number; icon: string }) {
  const size = 48
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ratio)
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="stroke-brand-500 transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="absolute text-xl" aria-hidden>
        {icon}
      </span>
    </div>
  )
}
