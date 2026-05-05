import { describe, expect, it } from 'vitest'
import { shouldNotifyLowStock } from '../inventoryWatcher'
import type { Inventory } from '../../types'

const inv: Inventory = {
  reminderId: 'r1',
  remaining: 2,
  unit: 'St',
  refillThreshold: 5,
  updatedAt: 0,
}

describe('shouldNotifyLowStock', () => {
  it('triggert wenn remaining <= threshold und keine Historie', () => {
    expect(shouldNotifyLowStock(inv, 1000, new Map())).toBe(true)
  })

  it('triggert nicht über Threshold', () => {
    const ok = { ...inv, remaining: 10 }
    expect(shouldNotifyLowStock(ok, 1000, new Map())).toBe(false)
  })

  it('respektiert Cooldown von 6h', () => {
    const recent = new Map([['r1', 1000]])
    expect(shouldNotifyLowStock(inv, 1000 + 5 * 60 * 60 * 1000, recent)).toBe(
      false,
    )
    expect(shouldNotifyLowStock(inv, 1000 + 7 * 60 * 60 * 1000, recent)).toBe(
      true,
    )
  })
})
