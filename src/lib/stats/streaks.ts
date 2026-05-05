import type { ReminderEvent } from '../types'
import { dayKeyAddDays, dayKeyForDate, diffDays } from './dayKey'
/**
 * A "successful" day is any day with at least one `completed` event.
 * We treat duration / count progress as not yet complete unless paired
 * with a `completed` event — a habit's binary close-out.
 */
export function successfulDayKeys(events: readonly ReminderEvent[]): Set<string> {
  const out = new Set<string>()
  for (const event of events) {
    if (event.action !== 'completed') continue
    const ts = event.triggeredAt ?? event.scheduledFor
    if (ts == null) continue
    out.add(dayKeyForDate(new Date(ts)))
  }
  return out
}

/**
 * Current streak = consecutive days ending today (or yesterday, if today
 * hasn't been ticked yet) where the habit was completed.
 *
 * Rationale: counting today as a "miss" before evening would feel wrong, so
 * we let the streak survive until tomorrow's check.
 */
export function currentStreak(
  events: readonly ReminderEvent[],
  today: Date = new Date(),
): number {
  const days = successfulDayKeys(events)
  if (days.size === 0) return 0

  const todayKey = dayKeyForDate(today)
  let cursor = days.has(todayKey) ? todayKey : dayKeyAddDays(todayKey, -1)
  if (!days.has(cursor)) return 0

  let count = 0
  while (days.has(cursor)) {
    count += 1
    cursor = dayKeyAddDays(cursor, -1)
  }
  return count
}

export function longestStreak(events: readonly ReminderEvent[]): number {
  const days = [...successfulDayKeys(events)].sort()
  if (days.length === 0) return 0

  let best = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    if (diffDays(days[i], days[i - 1]) === 1) {
      run += 1
      if (run > best) best = run
    } else {
      run = 1
    }
  }
  return best
}

export interface StreakStats {
  current: number
  longest: number
  totalSuccessfulDays: number
}

export function streakStats(
  events: readonly ReminderEvent[],
  today: Date = new Date(),
): StreakStats {
  return {
    current: currentStreak(events, today),
    longest: longestStreak(events),
    totalSuccessfulDays: successfulDayKeys(events).size,
  }
}

/**
 * Streak-Freeze: erlaubt eine kalendar-monatlich budgetierte Pausentag-Anzahl
 * (Default 1). Ein „Frost"-Tag fehlt zwar im Tagesschema, bricht die Streak
 * aber nicht. Pro Streak wird der Freeze-Topf gemäß Budget pro angefangenem
 * Kalendermonat berechnet, in dem die Streak liegt.
 */
export function currentStreakWithFreeze(
  events: readonly ReminderEvent[],
  options: { today?: Date; freezePerMonth?: number } = {},
): { length: number; freezesUsed: number } {
  const today = options.today ?? new Date()
  const freezePerMonth = options.freezePerMonth ?? 1
  const days = successfulDayKeys(events)
  if (days.size === 0) return { length: 0, freezesUsed: 0 }

  const todayKey = dayKeyForDate(today)
  let cursor = days.has(todayKey) ? todayKey : dayKeyAddDays(todayKey, -1)
  if (!days.has(cursor)) return { length: 0, freezesUsed: 0 }

  // Beyond the earliest hit, the streak has nothing to anchor on. Don't burn
  // freezes on prehistoric gaps.
  const earliest = [...days].sort()[0]

  const monthBudget = new Map<string, number>()
  function takeFreeze(dayK: string): boolean {
    const monthKey = dayK.slice(0, 7)
    const used = monthBudget.get(monthKey) ?? 0
    if (used >= freezePerMonth) return false
    monthBudget.set(monthKey, used + 1)
    return true
  }

  let length = 0
  let freezesUsed = 0
  while (cursor >= earliest) {
    if (days.has(cursor)) {
      length += 1
      cursor = dayKeyAddDays(cursor, -1)
      continue
    }
    if (takeFreeze(cursor)) {
      freezesUsed += 1
      cursor = dayKeyAddDays(cursor, -1)
      continue
    }
    break
  }
  return { length, freezesUsed }
}
