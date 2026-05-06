import { describe, expect, it } from 'vitest'
import {
  STREAK_MILESTONES,
  isMilestone,
  nextMilestone,
} from '../streakMilestones'

describe('streakMilestones', () => {
  it('exposes the canonical milestone set', () => {
    expect(STREAK_MILESTONES).toEqual([7, 30, 100, 365])
  })

  it('detects exact milestone hits', () => {
    expect(isMilestone(7)).toBe(true)
    expect(isMilestone(30)).toBe(true)
    expect(isMilestone(100)).toBe(true)
    expect(isMilestone(365)).toBe(true)
  })

  it('rejects non-milestones', () => {
    expect(isMilestone(0)).toBe(false)
    expect(isMilestone(6)).toBe(false)
    expect(isMilestone(8)).toBe(false)
    expect(isMilestone(366)).toBe(false)
  })

  it('returns the next milestone above current streak', () => {
    expect(nextMilestone(0)).toBe(7)
    expect(nextMilestone(6)).toBe(7)
    expect(nextMilestone(7)).toBe(30)
    expect(nextMilestone(29)).toBe(30)
    expect(nextMilestone(99)).toBe(100)
    expect(nextMilestone(364)).toBe(365)
    expect(nextMilestone(365)).toBeNull()
    expect(nextMilestone(500)).toBeNull()
  })
})
