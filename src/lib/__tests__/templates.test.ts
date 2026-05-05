import { describe, expect, it } from 'vitest'
import {
  ALL_TEMPLATES,
  HABIT_TEMPLATES,
  REMINDER_TEMPLATES,
} from '../templates'

describe('Templates', () => {
  it('liefert 10 Reminder-Templates', () => {
    expect(REMINDER_TEMPLATES).toHaveLength(10)
  })

  it('liefert 10 Habit-Templates', () => {
    expect(HABIT_TEMPLATES).toHaveLength(10)
  })

  it('Habit-Templates haben alle ein defaultGoal', () => {
    for (const template of HABIT_TEMPLATES) {
      expect(template.kind).toBe('habit')
      expect(template.defaultGoal).toBeDefined()
    }
  })

  it('hat eindeutige keys', () => {
    const keys = ALL_TEMPLATES.map((t) => t.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('jede defaultSchedule hat einen gültigen type', () => {
    const validTypes = new Set([
      'interval',
      'daily',
      'weekly',
      'biweekly',
      'monthly',
      'yearly',
      'elapsed',
      'expires',
      'inventory_based',
    ])
    for (const t of ALL_TEMPLATES) {
      expect(validTypes.has(t.defaultSchedule.type)).toBe(true)
    }
  })
})
