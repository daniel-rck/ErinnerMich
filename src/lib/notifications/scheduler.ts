import type { Reminder } from '../types'
import { getReminder, listReminders } from '../db/reminders'
import { subscribe } from '../db/broadcast'
import {
  armReminderTriggers,
  clearAllTriggers,
  clearReminderTriggers,
  supportsNotificationTriggers,
} from './triggers'
import { armInTabTimers, clearInTabTimers, clearAllInTabTimers } from './inTab'

let started = false
let unsubscribe: (() => void) | null = null

export interface SchedulerStatus {
  mode: 'triggers' | 'in-tab' | 'unsupported'
  hasPermission: boolean
}

export function schedulerStatus(): SchedulerStatus {
  if (typeof Notification === 'undefined') {
    return { mode: 'unsupported', hasPermission: false }
  }
  return {
    mode: supportsNotificationTriggers() ? 'triggers' : 'in-tab',
    hasPermission: Notification.permission === 'granted',
  }
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  try {
    return (await navigator.serviceWorker.ready) ?? null
  } catch {
    return null
  }
}

export async function rearmReminder(reminder: Reminder): Promise<void> {
  const status = schedulerStatus()
  if (status.mode === 'unsupported' || !status.hasPermission) return

  const registration = await getRegistration()
  if (status.mode === 'triggers' && registration) {
    await armReminderTriggers(registration, reminder)
  } else {
    armInTabTimers(registration, reminder)
  }
}

export async function clearReminder(reminderId: string): Promise<void> {
  clearInTabTimers(reminderId)
  const registration = await getRegistration()
  if (registration) {
    await clearReminderTriggers(registration, reminderId)
  }
}

export async function rearmAll(): Promise<void> {
  const status = schedulerStatus()
  if (status.mode === 'unsupported' || !status.hasPermission) return
  const reminders = await listReminders({ activeOnly: true })
  for (const reminder of reminders) {
    await rearmReminder(reminder)
  }
}

/**
 * Subscribes to the DB broadcast channel and re-arms / clears notifications
 * automatically when reminders change. Idempotent — calling twice is a no-op.
 */
export function startScheduler(): () => void {
  if (started) return stopScheduler
  started = true

  unsubscribe = subscribe((message) => {
    void handleMessage(message)
  })

  void rearmAll()
  return stopScheduler
}

export function stopScheduler(): void {
  if (!started) return
  unsubscribe?.()
  unsubscribe = null
  clearAllInTabTimers()
  started = false
}

async function handleMessage(message: { type: string }): Promise<void> {
  if (message.type === 'reminder-changed' && 'id' in message) {
    const reminder = await getReminder(message.id as string)
    if (!reminder || !reminder.active) {
      await clearReminder(message.id as string)
      return
    }
    await rearmReminder(reminder)
    return
  }
  if (message.type === 'reminder-deleted' && 'id' in message) {
    await clearReminder(message.id as string)
    return
  }
  if (message.type === 'db-cleared') {
    clearAllInTabTimers()
    const registration = await getRegistration()
    if (registration) {
      await clearAllTriggers(registration)
    }
    // After a wipe (Import-Replace), arm whatever now lives in the DB.
    await rearmAll()
  }
}

export async function showTestNotification(delayMs = 10_000): Promise<boolean> {
  const status = schedulerStatus()
  if (status.mode === 'unsupported' || !status.hasPermission) return false
  const registration = await getRegistration()
  const fireAt = Date.now() + delayMs

  if (status.mode === 'triggers' && registration && supportsNotificationTriggers()) {
    const TimestampTriggerCtor = (
      globalThis as unknown as {
        TimestampTrigger?: new (timestamp: number) => object
      }
    ).TimestampTrigger
    if (TimestampTriggerCtor) {
      await registration.showNotification('ErinnerMich – Test', {
        tag: 'test-notification',
        body: `Diese Test-Benachrichtigung wurde in ~${Math.round(delayMs / 1000)}s ausgelöst.`,
        ...({ showTrigger: new TimestampTriggerCtor(fireAt) } as Record<string, unknown>),
      })
      return true
    }
  }

  setTimeout(() => {
    if (registration) {
      void registration.showNotification('ErinnerMich – Test', {
        tag: 'test-notification',
        body: 'Diese Test-Benachrichtigung wurde aus dem offenen Tab ausgelöst.',
      })
    } else if (typeof Notification !== 'undefined') {
      new Notification('ErinnerMich – Test', {
        tag: 'test-notification',
        body: 'Diese Test-Benachrichtigung wurde aus dem offenen Tab ausgelöst.',
      })
    }
  }, delayMs)
  return true
}

export function _resetSchedulerForTests(): void {
  unsubscribe?.()
  unsubscribe = null
  started = false
  clearAllInTabTimers()
}
