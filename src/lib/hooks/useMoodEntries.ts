import { useCallback, useEffect, useState } from 'react'
import type { MoodEntry } from '../types'
import {
  dailyMoodAverage,
  listMoodEntriesForDay,
  listMoodEntriesInRange,
} from '../db/moodEntries'
import { subscribe } from '../db/broadcast'

export function useMoodEntriesInRange(
  fromMs: number,
  toMs: number,
): { entries: MoodEntry[]; loading: boolean; reload: () => Promise<void> } {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const data = await listMoodEntriesInRange(fromMs, toMs)
    setEntries(data)
    setLoading(false)
  }, [fromMs, toMs])

  useEffect(() => {
    void reload()
    const unsubscribe = subscribe((message) => {
      if (
        message.type === 'mood-added' ||
        message.type === 'mood-deleted' ||
        message.type === 'db-cleared'
      ) {
        void reload()
      }
    })
    return unsubscribe
  }, [reload])

  return { entries, loading, reload }
}

export function useMoodEntriesForDay(day: string) {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const data = await listMoodEntriesForDay(day)
    setEntries(data)
    setLoading(false)
  }, [day])

  useEffect(() => {
    void reload()
    const unsubscribe = subscribe((message) => {
      if (
        message.type === 'mood-added' ||
        message.type === 'mood-deleted' ||
        message.type === 'db-cleared'
      ) {
        void reload()
      }
    })
    return unsubscribe
  }, [reload])

  return { entries, loading, reload }
}

export function useDailyMoodAverage(day: string) {
  const [state, setState] = useState({
    avgMood: 0,
    avgEnergy: null as number | null,
    count: 0,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const result = await dailyMoodAverage(day)
      if (!cancelled) setState({ ...result, loading: false })
    }

    void load()
    const unsubscribe = subscribe((message) => {
      if (
        message.type === 'mood-added' ||
        message.type === 'mood-deleted' ||
        message.type === 'db-cleared'
      ) {
        void load()
      }
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [day])

  return state
}
