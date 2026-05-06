import { describe, expect, it } from 'vitest'
import { categoryClasses } from '../categoryColors'
import type { CategoryKey } from '../types'

const ALL_CATEGORIES: CategoryKey[] = [
  'plant',
  'health',
  'home',
  'finance',
  'auto',
  'social',
  'work',
  'season',
  'expiry',
  'inventory',
  'mood',
  'fitness',
  'mind',
  'other',
]

describe('categoryClasses', () => {
  it('returns a class set for every CategoryKey', () => {
    for (const cat of ALL_CATEGORIES) {
      const c = categoryClasses(cat)
      expect(c.borderL).toMatch(/^border-l-/)
      expect(c.bg).toMatch(/^bg-/)
      expect(c.text).toMatch(/^text-/)
      expect(c.ring).toMatch(/^stroke-/)
      expect(c.iconBg).toMatch(/^bg-/)
    }
  })

  it('uses brand-adjacent tones for distinct categories', () => {
    expect(categoryClasses('mood').borderL).toContain('violet')
    expect(categoryClasses('health').borderL).toContain('rose')
    expect(categoryClasses('finance').borderL).toContain('blue')
  })
})
