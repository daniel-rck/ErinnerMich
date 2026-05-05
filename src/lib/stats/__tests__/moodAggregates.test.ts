import { describe, expect, it } from 'vitest'
import {
  dailyMoodSeries,
  moodByWeekday,
  moodOverview,
  tagRollup,
} from '../moodAggregates'
import type { MoodEntry, MoodValue } from '../../types'

function entry(
  daysAgo: number,
  mood: MoodValue,
  today = new Date(2026, 4, 5),
  extra: Partial<MoodEntry> = {},
): MoodEntry {
  const d = new Date(today)
  d.setDate(d.getDate() - daysAgo)
  return {
    id: `m-${daysAgo}-${mood}`,
    loggedAt: d.getTime(),
    mood,
    ...extra,
  }
}

const TODAY = new Date(2026, 4, 5) // Tue

describe('dailyMoodSeries', () => {
  it('mittelt mehrere Einträge pro Tag', () => {
    const series = dailyMoodSeries([entry(0, 5), entry(0, 3)], 1, TODAY)
    expect(series).toHaveLength(1)
    expect(series[0].avgMood).toBe(4)
    expect(series[0].count).toBe(2)
  })

  it('liefert null für Tage ohne Einträge', () => {
    const series = dailyMoodSeries([entry(2, 4)], 5, TODAY)
    expect(series).toHaveLength(5)
    expect(series.find((p) => p.day === '2026-05-03')!.avgMood).toBe(4)
    expect(series.find((p) => p.day === '2026-05-05')!.avgMood).toBeNull()
  })
})

describe('moodByWeekday', () => {
  it('legt 7 Buckets an, einer pro Wochentag', () => {
    const buckets = moodByWeekday([])
    expect(buckets).toHaveLength(7)
    expect(buckets.map((b) => b.label)).toEqual([
      'So',
      'Mo',
      'Di',
      'Mi',
      'Do',
      'Fr',
      'Sa',
    ])
  })

  it('ordnet Einträge dem korrekten Wochentag zu', () => {
    const tuesday = new Date(2026, 4, 5).getTime() // Tue
    const friday = new Date(2026, 4, 8).getTime() // Fri
    const buckets = moodByWeekday([
      { id: '1', loggedAt: tuesday, mood: 5 },
      { id: '2', loggedAt: tuesday, mood: 3 },
      { id: '3', loggedAt: friday, mood: 1 },
    ])
    expect(buckets[2].label).toBe('Di')
    expect(buckets[2].avgMood).toBe(4)
    expect(buckets[2].count).toBe(2)
    expect(buckets[5].label).toBe('Fr')
    expect(buckets[5].avgMood).toBe(1)
  })
})

describe('moodOverview', () => {
  it('liefert null-Werte ohne Einträge', () => {
    expect(moodOverview([], 30, TODAY)).toEqual({
      count: 0,
      avgMood: null,
      avgEnergy: null,
      bestDay: null,
      worstDay: null,
    })
  })

  it('berechnet Mood + Energy-Durchschnitte', () => {
    const entries: MoodEntry[] = [
      entry(0, 5, TODAY, { energy: 4 }),
      entry(1, 3, TODAY, { energy: 2 }),
      entry(2, 1, TODAY),
    ]
    const overview = moodOverview(entries, 30, TODAY)
    expect(overview.count).toBe(3)
    expect(overview.avgMood).toBe(3)
    expect(overview.avgEnergy).toBe(3)
    expect(overview.bestDay?.day).toBe('2026-05-05')
    expect(overview.worstDay?.day).toBe('2026-05-03')
  })
})

describe('tagRollup', () => {
  it('aggregiert Tags mit Häufigkeit + Ø Mood, sortiert', () => {
    const entries: MoodEntry[] = [
      entry(0, 5, TODAY, { tags: ['sport', 'sozial'] }),
      entry(1, 4, TODAY, { tags: ['sport'] }),
      entry(2, 1, TODAY, { tags: ['stress'] }),
    ]
    const rollup = tagRollup(entries)
    expect(rollup[0]).toEqual({ tag: 'sport', count: 2, avgMood: 4.5 })
    expect(rollup.find((b) => b.tag === 'stress')).toEqual({
      tag: 'stress',
      count: 1,
      avgMood: 1,
    })
  })

  it('returnt leeres Array für Einträge ohne Tags', () => {
    expect(tagRollup([entry(0, 3, TODAY)])).toEqual([])
  })
})
