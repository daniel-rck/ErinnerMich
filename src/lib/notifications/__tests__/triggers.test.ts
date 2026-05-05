import { describe, expect, it } from 'vitest'
import { planTriggers } from '../triggers'
import type { Reminder } from '../../types'

const baseReminder: Reminder = {
  id: 'r-1',
  kind: 'reminder',
  title: 'Test',
  icon: '⏰',
  category: 'other',
  color: 'emerald',
  schedule: { type: 'daily', times: ['09:00', '20:00'] },
  streakSensitive: false,
  active: true,
  createdAt: 0,
  updatedAt: 0,
}

describe('planTriggers', () => {
  it('gibt nichts zurück, wenn der Reminder inaktiv ist', () => {
    const inactive = { ...baseReminder, active: false }
    expect(planTriggers(inactive, new Date('2026-01-01T08:00:00Z'))).toEqual([])
  })

  it('plant n=5 daily-Triggers chronologisch', () => {
    const planned = planTriggers(
      baseReminder,
      new Date('2026-01-01T07:00:00'),
      5,
    )
    expect(planned).toHaveLength(5)
    const stamps = planned.map((p) => p.scheduledFor.getTime())
    const sorted = [...stamps].sort((a, b) => a - b)
    expect(stamps).toEqual(sorted)
  })

  it('expandiert expires-Schedules zu allen PreWarnings', () => {
    const expiresAt = new Date('2027-01-01T12:00:00Z').getTime()
    const expiresReminder: Reminder = {
      ...baseReminder,
      schedule: {
        type: 'expires',
        expiresAt,
        preWarnings: [
          { kind: 'months', value: 6 },
          { kind: 'months', value: 1 },
          { kind: 'days', value: 7 },
        ],
      },
    }
    const planned = planTriggers(
      expiresReminder,
      new Date('2026-01-01T00:00:00Z'),
      10,
    )
    expect(planned.length).toBeGreaterThanOrEqual(4)
    expect(planned.at(-1)?.scheduledFor.getTime()).toBe(expiresAt)
  })

  it('liefert für inventory_based keinen Trigger', () => {
    const inv: Reminder = {
      ...baseReminder,
      schedule: { type: 'inventory_based' },
    }
    expect(planTriggers(inv, new Date())).toEqual([])
  })
})
