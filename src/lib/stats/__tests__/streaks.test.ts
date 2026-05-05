import { describe, expect, it } from 'vitest'
import {
  currentStreak,
  currentStreakWithFreeze,
  longestStreak,
  streakStats,
  successfulDayKeys,
} from '../streaks'
import type { ReminderEvent } from '../../types'

function event(
  daysAgo: number,
  action: ReminderEvent['action'] = 'completed',
  today = new Date(2026, 4, 5),
): ReminderEvent {
  const d = new Date(today)
  d.setDate(d.getDate() - daysAgo)
  return {
    id: `e-${daysAgo}-${action}`,
    reminderId: 'r-1',
    action,
    triggeredAt: d.getTime(),
  }
}

const TODAY = new Date(2026, 4, 5)

describe('successfulDayKeys', () => {
  it('berücksichtigt nur completed-Events', () => {
    const keys = successfulDayKeys([
      event(0),
      event(1, 'snoozed'),
      event(2),
    ])
    expect(keys.size).toBe(2)
    expect(keys.has('2026-05-05')).toBe(true)
    expect(keys.has('2026-05-03')).toBe(true)
  })

  it('dedupliziert mehrere completions am selben Tag', () => {
    const keys = successfulDayKeys([event(0), event(0), event(0)])
    expect(keys.size).toBe(1)
  })
})

describe('currentStreak', () => {
  it('zählt zusammenhängende Tage rückwärts ab heute', () => {
    expect(
      currentStreak([event(0), event(1), event(2), event(4)], TODAY),
    ).toBe(3)
  })

  it('lässt heute aus, wenn noch nicht gehakt, aber gestern war', () => {
    expect(currentStreak([event(1), event(2), event(3)], TODAY)).toBe(3)
  })

  it('returnt 0, wenn gestern *und* heute fehlen', () => {
    expect(currentStreak([event(2), event(3), event(4)], TODAY)).toBe(0)
  })

  it('returnt 0 für leere Liste', () => {
    expect(currentStreak([], TODAY)).toBe(0)
  })
})

describe('longestStreak', () => {
  it('findet die längste zusammenhängende Sequenz', () => {
    const events = [
      event(0),
      event(1),
      event(2),
      event(5),
      event(6),
      event(7),
      event(8),
      event(20),
    ]
    expect(longestStreak(events)).toBe(4)
  })

  it('ist 1 für genau einen Tag', () => {
    expect(longestStreak([event(10)])).toBe(1)
  })

  it('ist 0 ohne Events', () => {
    expect(longestStreak([])).toBe(0)
  })
})

describe('streakStats', () => {
  it('liefert current, longest und totalSuccessfulDays', () => {
    const events = [event(0), event(1), event(5), event(6), event(7)]
    expect(streakStats(events, TODAY)).toEqual({
      current: 2,
      longest: 3,
      totalSuccessfulDays: 5,
    })
  })
})

describe('currentStreakWithFreeze', () => {
  it('rettet eine 1-Tag-Lücke mit dem Monatsbudget', () => {
    const events = [event(0), event(1), event(3), event(4), event(5)]
    const { length, freezesUsed } = currentStreakWithFreeze(events, {
      today: TODAY,
    })
    expect(length).toBe(5)
    expect(freezesUsed).toBe(1)
  })

  it('limitiert Freezes auf das Monatsbudget', () => {
    // Lücken an Tag 2 und 4, aber nur 1 Freeze pro Monat im Mai → bricht
    const events = [event(0), event(1), event(3), event(5)]
    const { length, freezesUsed } = currentStreakWithFreeze(events, {
      today: TODAY,
    })
    expect(length).toBe(3)
    expect(freezesUsed).toBe(1)
  })

  it('respektiert ein höheres Budget', () => {
    const events = [event(0), event(1), event(3), event(5)]
    const { length, freezesUsed } = currentStreakWithFreeze(events, {
      today: TODAY,
      freezePerMonth: 2,
    })
    expect(length).toBe(4)
    expect(freezesUsed).toBe(2)
  })

  it('returnt Null-Streak ohne aktuellen Treffer', () => {
    const events = [event(3), event(4), event(5)]
    const { length, freezesUsed } = currentStreakWithFreeze(events, {
      today: TODAY,
    })
    // Tag 0 + 1 fehlen, keine Freezes mehr → 0
    expect(length).toBe(0)
    expect(freezesUsed).toBe(0)
  })
})
