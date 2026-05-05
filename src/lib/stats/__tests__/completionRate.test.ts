import { describe, expect, it } from 'vitest'
import {
  averageDaysBetweenCompletions,
  completedCount,
  completionRateForWindow,
  completionSummary,
} from '../completionRate'
import type { ReminderEvent } from '../../types'

const DAY = 24 * 60 * 60 * 1000

function completedAt(date: Date, id = `e-${date.getTime()}`): ReminderEvent {
  return {
    id,
    reminderId: 'r-1',
    action: 'completed',
    triggeredAt: date.getTime(),
  }
}

const TODAY = new Date(2026, 4, 5)

function daysAgo(n: number): Date {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d
}

describe('completionRateForWindow', () => {
  it('zählt die unterschiedlichen Erfolgstage im Fenster', () => {
    const events = [
      completedAt(daysAgo(0)),
      completedAt(daysAgo(0), 'dup'),
      completedAt(daysAgo(2)),
      completedAt(daysAgo(8)),
    ]
    const rate = completionRateForWindow(events, 7, TODAY)
    expect(rate.successfulDays).toBe(2)
    expect(rate.rate).toBeCloseTo(2 / 7)
  })

  it('lässt ältere Events außerhalb des Fensters weg', () => {
    const events = [completedAt(daysAgo(40))]
    const rate = completionRateForWindow(events, 7, TODAY)
    expect(rate.successfulDays).toBe(0)
  })
})

describe('completionSummary', () => {
  it('liefert 7/30/365-Quoten gleichzeitig', () => {
    const events = [
      completedAt(daysAgo(0)),
      completedAt(daysAgo(10)),
      completedAt(daysAgo(100)),
      completedAt(daysAgo(400)),
    ]
    const summary = completionSummary(events, TODAY)
    expect(summary.last7.successfulDays).toBe(1)
    expect(summary.last30.successfulDays).toBe(2)
    expect(summary.last365.successfulDays).toBe(3)
  })
})

describe('averageDaysBetweenCompletions', () => {
  it('returnt null bei < 2 Erledigungen', () => {
    expect(averageDaysBetweenCompletions([])).toBeNull()
    expect(averageDaysBetweenCompletions([completedAt(daysAgo(0))])).toBeNull()
  })

  it('mittelt die Lücken in Tagen', () => {
    const events = [
      completedAt(new Date(2026, 0, 1)),
      completedAt(new Date(2026, 0, 6)), // 5 days gap
      completedAt(new Date(2026, 0, 11)), // 5 days gap
    ]
    expect(averageDaysBetweenCompletions(events)).toBe(5)
  })

  it('erkennt unterschiedliche Lücken', () => {
    const events = [
      completedAt(new Date(2026, 0, 1)),
      completedAt(new Date(2026, 0, 4)), // 3 days
      completedAt(new Date(2026, 0, 11)), // 7 days
    ]
    const avg = averageDaysBetweenCompletions(events)
    expect(avg).toBeCloseTo(5)
  })

  it('ignoriert non-completed Events', () => {
    const events: ReminderEvent[] = [
      completedAt(new Date(2026, 0, 1)),
      {
        id: 'snz',
        reminderId: 'r-1',
        action: 'snoozed',
        triggeredAt: new Date(2026, 0, 2).getTime(),
      },
      completedAt(new Date(2026, 0, 6)),
    ]
    expect(averageDaysBetweenCompletions(events)).toBe(5)
  })
})

describe('completedCount', () => {
  it('zählt nur completed-Events', () => {
    const events: ReminderEvent[] = [
      completedAt(daysAgo(0)),
      completedAt(daysAgo(1)),
      {
        id: 'skip',
        reminderId: 'r-1',
        action: 'skipped',
        triggeredAt: Date.now(),
      },
    ]
    expect(completedCount(events)).toBe(2)
  })
})

// guard against accidental import drift
void DAY
