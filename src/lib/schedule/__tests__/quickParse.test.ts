import { describe, expect, it } from 'vitest'
import { quickParse } from '../quickParse'

describe('quickParse', () => {
  it('returns null on empty', () => {
    expect(quickParse('')).toBeNull()
    expect(quickParse('   ')).toBeNull()
  })

  it('parses weekday + HH:MM', () => {
    const r = quickParse('Mama anrufen Sonntag 18:00')
    expect(r).not.toBeNull()
    expect(r!.title).toBe('Mama anrufen')
    expect(r!.schedule).toEqual({
      type: 'weekly',
      days: ['SUN'],
      time: '18:00',
    })
  })

  it('parses weekday + "X Uhr"', () => {
    const r = quickParse('Yoga Montag 7 Uhr')
    expect(r).not.toBeNull()
    expect(r!.schedule).toEqual({
      type: 'weekly',
      days: ['MON'],
      time: '07:00',
    })
  })

  it('parses short weekday abbreviation', () => {
    const r = quickParse('Sport Mi 18:30')
    expect(r).not.toBeNull()
    expect(r!.schedule).toEqual({
      type: 'weekly',
      days: ['WED'],
      time: '18:30',
    })
  })

  it('parses "heute HH:MM"', () => {
    const r = quickParse('Wäsche heute 20:00')
    expect(r!.title).toBe('Wäsche')
    expect(r!.schedule).toEqual({ type: 'daily', times: ['20:00'] })
  })

  it('parses "morgen 8 Uhr" relative to date', () => {
    const fixed = new Date('2026-05-04T10:00:00') // Monday
    const r = quickParse('Müll morgen 8 Uhr', fixed)
    expect(r!.title).toBe('Müll')
    expect(r!.schedule.type).toBe('weekly')
    if (r!.schedule.type === 'weekly') {
      expect(r!.schedule.days).toEqual(['TUE'])
      expect(r!.schedule.time).toBe('08:00')
    }
  })

  it('parses "in N Tagen" as elapsed', () => {
    const r = quickParse('Pflanzen gießen in 7 Tagen')
    expect(r!.title).toBe('Pflanzen gießen')
    expect(r!.schedule).toEqual({ type: 'elapsed', days: 7 })
  })

  it('uses default 09:00 when only weekday given', () => {
    const r = quickParse('Treffen Freitag')
    expect(r!.schedule).toEqual({
      type: 'weekly',
      days: ['FRI'],
      time: '09:00',
    })
  })

  it('returns null when nothing time-like is found', () => {
    expect(quickParse('einfach nur ein title')).toBeNull()
  })

  it('handles "Wasser trinken morgen 8 Uhr"', () => {
    const fixed = new Date('2026-05-05T10:00:00') // Tuesday
    const r = quickParse('Wasser trinken morgen 8 Uhr', fixed)
    expect(r!.title).toBe('Wasser trinken')
    expect(r!.schedule.type).toBe('weekly')
  })
})
