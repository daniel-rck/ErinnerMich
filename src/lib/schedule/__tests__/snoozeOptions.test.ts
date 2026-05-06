import { describe, expect, it } from 'vitest'
import { snoozeOptions } from '../snoozeOptions'

describe('snoozeOptions', () => {
  it('drops "Heute Abend" when 18:00 is already past', () => {
    const now = new Date('2026-05-04T19:30:00')
    const opts = snoozeOptions(now)
    expect(opts.find((o) => o.key === 'tonight')).toBeUndefined()
  })

  it('keeps "Heute Abend" when at least 30 min ahead', () => {
    const now = new Date('2026-05-04T12:00:00')
    const opts = snoozeOptions(now)
    const tonight = opts.find((o) => o.key === 'tonight')
    expect(tonight).toBeDefined()
    expect(tonight!.at.getHours()).toBe(18)
  })

  it('"Morgen früh" is the next day at 08:00', () => {
    const now = new Date('2026-05-04T19:00:00')
    const opt = snoozeOptions(now).find((o) => o.key === 'tomorrow-morning')!
    expect(opt.at.getHours()).toBe(8)
    expect(opt.at.getDate()).toBe(5)
  })

  it('next-week always lands on a Monday at 09:00', () => {
    // Wednesday
    const now = new Date('2026-05-06T15:00:00')
    const opt = snoozeOptions(now).find((o) => o.key === 'next-week')!
    expect(opt.at.getDay()).toBe(1)
    expect(opt.at.getHours()).toBe(9)
    expect(opt.at.getTime()).toBeGreaterThan(now.getTime())
  })

  it('every option lies in the future', () => {
    const now = new Date('2026-05-04T10:00:00')
    for (const o of snoozeOptions(now)) {
      expect(o.at.getTime()).toBeGreaterThan(now.getTime())
    }
  })
})
