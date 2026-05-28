import { useCallback, useEffect, useState } from 'react'
import type { ReminderEvent } from '../types'
import { dailyProgress, listEventsForReminder } from '../db/events'
import { subscribe } from '../db/broadcast'

export function useEvents(reminderId: string | null): {
  events: ReminderEvent[]
  loading: boolean
  reload: () => Promise<void>
} {
  const [events, setEvents] = useState<ReminderEvent[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!reminderId) {
      setEvents([])
      setLoading(false)
      return
    }
    const data = await listEventsForReminder(reminderId)
    setEvents(data)
    setLoading(false)
  }, [reminderId])

  useEffect(() => {
    void reload()
    const unsubscribe = subscribe((message) => {
      if (
        ((message.type === 'event-added' || message.type === 'event-deleted') &&
          message.reminderId === reminderId) ||
        message.type === 'db-cleared'
      ) {
        void reload()
      }
    })
    return unsubscribe
  }, [reload, reminderId])

  return { events, loading, reload }
}

export function useDailyProgress(
  reminderId: string | null,
  date: number | string,
): { completions: number; sum: number; loading: boolean } {
  const [state, setState] = useState({
    completions: 0,
    sum: 0,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!reminderId) {
        if (!cancelled) setState({ completions: 0, sum: 0, loading: false })
        return
      }
      const result = await dailyProgress(reminderId, date)
      if (!cancelled) {
        setState({
          completions: result.completions,
          sum: result.sum,
          loading: false,
        })
      }
    }

    void load()
    const unsubscribe = subscribe((message) => {
      if (
        ((message.type === 'event-added' || message.type === 'event-deleted') &&
          message.reminderId === reminderId) ||
        message.type === 'db-cleared'
      ) {
        void load()
      }
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [reminderId, date])

  return state
}
