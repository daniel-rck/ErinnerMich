import type { MoodEntry, Reminder, ReminderEvent } from '../types'
import { dayKeyForDate } from './dayKey'

/**
 * Pearson correlation coefficient. Returns null when fewer than 2 paired
 * samples or when one variable has zero variance (otherwise it would divide
 * by zero — meaningless).
 */
export function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  if (xs.length !== ys.length) {
    throw new Error('pearson: xs and ys must have equal length')
  }
  if (xs.length < 2) return null
  const n = xs.length
  let sumX = 0
  let sumY = 0
  for (let i = 0; i < n; i++) {
    sumX += xs[i]
    sumY += ys[i]
  }
  const meanX = sumX / n
  const meanY = sumY / n
  let cov = 0
  let varX = 0
  let varY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    cov += dx * dy
    varX += dx * dx
    varY += dy * dy
  }
  if (varX === 0 || varY === 0) return null
  return cov / Math.sqrt(varX * varY)
}

export interface HabitMoodCorrelation {
  habitId: string
  habitTitle: string
  habitIcon: string
  /** Number of overlapping days where we had both a mood log and a habit decision */
  pairs: number
  /**
   * Pearson coefficient of (habit-completed: 0|1) vs (avg-mood-that-day).
   * `null` if too few pairs or zero variance.
   */
  r: number | null
}

/**
 * Builds correlation rows for each habit. A "habit-day" pair counts as 1 if
 * the habit had a `completed` event that day, else 0 — but only across days
 * that actually have a mood entry, so we don't conflate "no mood log" with 0.
 */
export function habitMoodCorrelations(
  habits: readonly Reminder[],
  events: readonly ReminderEvent[],
  moodEntries: readonly MoodEntry[],
): HabitMoodCorrelation[] {
  const moodByDay = new Map<string, number[]>()
  for (const entry of moodEntries) {
    const key = dayKeyForDate(new Date(entry.loggedAt))
    if (!moodByDay.has(key)) moodByDay.set(key, [])
    moodByDay.get(key)!.push(entry.mood)
  }
  const moodAvgByDay = new Map<string, number>()
  for (const [day, samples] of moodByDay) {
    moodAvgByDay.set(day, samples.reduce((a, b) => a + b, 0) / samples.length)
  }

  const habitCompletionsByDay = new Map<string, Set<string>>()
  for (const event of events) {
    if (event.action !== 'completed') continue
    const ts = event.triggeredAt ?? event.scheduledFor
    if (ts == null) continue
    const day = dayKeyForDate(new Date(ts))
    if (!habitCompletionsByDay.has(day)) {
      habitCompletionsByDay.set(day, new Set())
    }
    habitCompletionsByDay.get(day)!.add(event.reminderId)
  }

  const days = [...moodAvgByDay.keys()].sort()
  return habits.map((habit) => {
    const xs: number[] = []
    const ys: number[] = []
    for (const day of days) {
      const moodAvg = moodAvgByDay.get(day)!
      const completed =
        habitCompletionsByDay.get(day)?.has(habit.id) ? 1 : 0
      xs.push(completed)
      ys.push(moodAvg)
    }
    return {
      habitId: habit.id,
      habitTitle: habit.title,
      habitIcon: habit.icon,
      pairs: xs.length,
      r: pearson(xs, ys),
    }
  })
}
