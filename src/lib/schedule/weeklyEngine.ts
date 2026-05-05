import type { Schedule, Weekday } from '../types'
import { addDays, weekdayKey, weekParity, withTime } from './helpers'

type WeeklySchedule = Extract<Schedule, { type: 'weekly' }>
type BiweeklySchedule = Extract<Schedule, { type: 'biweekly' }>

export function nextWeeklyOccurrence(
  schedule: WeeklySchedule,
  from: Date,
): Date {
  if (schedule.days.length === 0) {
    throw new Error('weekly.days darf nicht leer sein')
  }
  return findNextMatching(from, schedule.days, schedule.time, () => true)
}

export function nextBiweeklyOccurrence(
  schedule: BiweeklySchedule,
  from: Date,
): Date {
  if (schedule.days.length === 0) {
    throw new Error('biweekly.days darf nicht leer sein')
  }
  return findNextMatching(
    from,
    schedule.days,
    schedule.time,
    (date) => weekParity(date) === schedule.weekParity,
  )
}

function findNextMatching(
  from: Date,
  days: Weekday[],
  time: string,
  weekFilter: (date: Date) => boolean,
): Date {
  for (let offset = 0; offset < 366; offset++) {
    const candidate = withTime(addDays(from, offset), time)
    if (candidate.getTime() <= from.getTime()) continue
    if (!days.includes(weekdayKey(candidate))) continue
    if (!weekFilter(candidate)) continue
    return candidate
  }
  throw new Error('Kein passendes Datum innerhalb eines Jahres gefunden')
}
