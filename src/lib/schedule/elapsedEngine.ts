import type { Schedule } from '../types'

type ElapsedSchedule = Extract<Schedule, { type: 'elapsed' }>

/**
 * For "every N days since last done" reminders.
 *
 * - With `lastDone`: next = lastDone + days. If that's already in the past
 *   relative to `from`, returns the past value (so the UI can render as
 *   "überfällig"). The renderer decides if it's a notification or just a
 *   visual cue.
 * - Without `lastDone`: anchor at `from + days` (first scheduling).
 */
export function nextElapsedOccurrence(
  schedule: ElapsedSchedule,
  from: Date,
): Date {
  if (schedule.days <= 0) {
    throw new Error('elapsed.days muss > 0 sein')
  }
  const dayMs = 24 * 60 * 60 * 1000
  if (schedule.lastDone !== undefined) {
    return new Date(schedule.lastDone + schedule.days * dayMs)
  }
  return new Date(from.getTime() + schedule.days * dayMs)
}
