import { useCallback, useEffect, useState } from 'react'
import type { Reminder, ReminderKind } from '../types'
import { listReminders } from '../db/reminders'
import { subscribe } from '../db/broadcast'

export interface UseRemindersOptions {
  kind?: ReminderKind
  activeOnly?: boolean
  includeArchived?: boolean
}

export function useReminders(options: UseRemindersOptions = {}): {
  reminders: Reminder[]
  loading: boolean
  error: Error | null
  reload: () => Promise<void>
} {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { kind, activeOnly, includeArchived } = options

  const reload = useCallback(async () => {
    try {
      const data = await listReminders({ kind, activeOnly, includeArchived })
      setReminders(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [kind, activeOnly, includeArchived])

  useEffect(() => {
    void reload()
    const unsubscribe = subscribe((message) => {
      if (
        message.type === 'reminder-changed' ||
        message.type === 'reminder-deleted' ||
        message.type === 'db-cleared'
      ) {
        void reload()
      }
    })
    return unsubscribe
  }, [reload])

  return { reminders, loading, error, reload }
}

export function useHabits(activeOnly = true) {
  return useReminders({ kind: 'habit', activeOnly })
}

export function useMoodReminders(activeOnly = true) {
  return useReminders({ kind: 'mood', activeOnly })
}
