import { describe, expect, it } from 'vitest'
import {
  nextBiweeklyOccurrence,
  nextWeeklyOccurrence,
} from '../weeklyEngine'
import { isoWeekNumber } from '../helpers'

describe('weeklyEngine', () => {
  it('findet nächsten Mo um 19:00 ab Fr', () => {
    const friday = new Date('2026-05-01T20:00:00') // Fr
    const next = nextWeeklyOccurrence(
      { type: 'weekly', days: ['MON'], time: '19:00' },
      friday,
    )
    expect(next.getDay()).toBe(1)
    expect(next.getHours()).toBe(19)
    expect(next.getDate()).toBe(4)
  })

  it('akzeptiert mehrere Wochentage und nimmt den nächsten', () => {
    const monday = new Date('2026-05-04T08:00:00') // Mo
    const next = nextWeeklyOccurrence(
      { type: 'weekly', days: ['TUE', 'FRI'], time: '19:00' },
      monday,
    )
    expect(next.getDay()).toBe(2) // Tue
  })

  it('rollt zum Folge-Wochentag wenn heutige Zeit schon vorbei', () => {
    const tuesday = new Date('2026-05-05T20:00:00') // Tue 20:00
    const next = nextWeeklyOccurrence(
      { type: 'weekly', days: ['TUE'], time: '19:00' },
      tuesday,
    )
    expect(next.getDate()).toBe(12) // nächster Tue
  })
})

describe('biweeklyEngine', () => {
  it('triggert nur in Wochen mit passender Parität', () => {
    const start = new Date('2026-05-01T00:00:00')
    const next = nextBiweeklyOccurrence(
      { type: 'biweekly', days: ['TUE'], time: '19:00', weekParity: 'even' },
      start,
    )
    expect(next.getDay()).toBe(2)
    expect(isoWeekNumber(next) % 2).toBe(0)
  })

  it('respektiert Jahreswechsel-Parität', () => {
    const dec = new Date('2025-12-29T00:00:00') // ISO week 1 of 2026 (odd)
    const next = nextBiweeklyOccurrence(
      { type: 'biweekly', days: ['MON'], time: '08:00', weekParity: 'odd' },
      dec,
    )
    expect(isoWeekNumber(next) % 2).toBe(1)
  })

  it('skipt 8 Tage zur nächsten passenden Woche', () => {
    const monStart = new Date('2026-05-04T07:00:00') // Mon, week ?
    const evenSchedule = nextBiweeklyOccurrence(
      { type: 'biweekly', days: ['MON'], time: '08:00', weekParity: 'even' },
      monStart,
    )
    const oddSchedule = nextBiweeklyOccurrence(
      { type: 'biweekly', days: ['MON'], time: '08:00', weekParity: 'odd' },
      monStart,
    )
    expect(isoWeekNumber(evenSchedule) % 2).toBe(0)
    expect(isoWeekNumber(oddSchedule) % 2).toBe(1)
    expect(Math.abs(evenSchedule.getTime() - oddSchedule.getTime())).toBeGreaterThan(0)
  })
})
