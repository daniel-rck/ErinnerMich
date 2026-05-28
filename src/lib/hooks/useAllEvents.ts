import { useEffect, useState } from 'react'
import type { ReminderEvent } from '../types'
import { getDB, type StoredReminderEvent } from '../db'
import { subscribe } from '../db/broadcast'

function strip(stored: StoredReminderEvent): ReminderEvent {
  const { triggeredAtDay: _day, ...rest } = stored
  return rest
}

export function useAllEvents(): {
  events: ReminderEvent[]
  loading: boolean
} {
  const [events, setEvents] = useState<ReminderEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const db = await getDB()
      const stored = await db.getAll('events')
      if (!cancelled) {
        setEvents(stored.map(strip))
        setLoading(false)
      }
    }

    void load()
    const unsubscribe = subscribe((message) => {
      if (
        message.type === 'event-added' ||
        message.type === 'event-deleted' ||
        message.type === 'reminder-deleted' ||
        message.type === 'db-cleared'
      ) {
        void load()
      }
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { events, loading }
}
