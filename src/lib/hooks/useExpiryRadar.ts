import { useEffect, useState } from 'react'
import type { Reminder } from '../types'
import { listReminders } from '../db/reminders'
import { subscribe } from '../db/broadcast'

export interface ExpiringReminder {
  reminder: Reminder
  expiresAt: number
  daysRemaining: number
}

export function useExpiryRadar(now?: number): {
  items: ExpiringReminder[]
  loading: boolean
} {
  const [items, setItems] = useState<ExpiringReminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const reference = now ?? Date.now()
      const all = await listReminders({ activeOnly: true })
      const expiring: ExpiringReminder[] = []
      for (const reminder of all) {
        if (reminder.schedule.type !== 'expires') continue
        const expiresAt = reminder.schedule.expiresAt
        const daysRemaining = Math.ceil(
          (expiresAt - reference) / (24 * 60 * 60 * 1000),
        )
        expiring.push({ reminder, expiresAt, daysRemaining })
      }
      expiring.sort((a, b) => a.expiresAt - b.expiresAt)
      if (!cancelled) {
        setItems(expiring)
        setLoading(false)
      }
    }

    void load()
    const unsubscribe = subscribe((message) => {
      if (
        message.type === 'reminder-changed' ||
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
  }, [now])

  return { items, loading }
}
