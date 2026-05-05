import { describe, expect, it } from 'vitest'
import { nextIntervalOccurrence } from '../intervalEngine'

describe('intervalEngine', () => {
  it('addiert minutes ohne activeWindow', () => {
    const from = new Date('2026-05-04T10:00:00')
    const next = nextIntervalOccurrence(
      { type: 'interval', minutes: 90 },
      from,
    )
    expect(next.getTime() - from.getTime()).toBe(90 * 60_000)
  })

  it('snapt vor Fenster auf Fenster-Start', () => {
    const from = new Date('2026-05-04T06:00:00')
    const next = nextIntervalOccurrence(
      {
        type: 'interval',
        minutes: 90,
        activeWindow: { start: '08:00', end: '20:00' },
      },
      from,
    )
    expect(next.getHours()).toBe(8)
    expect(next.getMinutes()).toBe(0)
  })

  it('addiert minutes innerhalb des Fensters', () => {
    const from = new Date('2026-05-04T12:00:00')
    const next = nextIntervalOccurrence(
      {
        type: 'interval',
        minutes: 90,
        activeWindow: { start: '08:00', end: '20:00' },
      },
      from,
    )
    expect(next.getHours()).toBe(13)
    expect(next.getMinutes()).toBe(30)
  })

  it('rollt zum Folgetag wenn next nach Fenster-Ende', () => {
    const from = new Date('2026-05-04T19:30:00')
    const next = nextIntervalOccurrence(
      {
        type: 'interval',
        minutes: 90,
        activeWindow: { start: '08:00', end: '20:00' },
      },
      from,
    )
    expect(next.getDate()).toBe(5)
    expect(next.getHours()).toBe(8)
  })

  it('verbietet activeWindow über Mitternacht', () => {
    expect(() =>
      nextIntervalOccurrence(
        {
          type: 'interval',
          minutes: 60,
          activeWindow: { start: '22:00', end: '06:00' },
        },
        new Date('2026-05-04T22:30:00'),
      ),
    ).toThrow(/Mitternacht/)
  })

  it('verlangt minutes > 0', () => {
    expect(() =>
      nextIntervalOccurrence(
        { type: 'interval', minutes: 0 },
        new Date(),
      ),
    ).toThrow()
  })
})
