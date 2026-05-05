import type { Reminder } from '../types'
import { planTriggers } from './triggers'
import { buildDescriptor } from './actions'

/**
 * In-tab fallback: schedules `setTimeout` callbacks that show notifications
 * via the active ServiceWorkerRegistration. Replaces any prior timers for
 * the same reminder. Used when the Notification Triggers API is missing.
 */
const INTAB_HORIZON_MS = 24 * 60 * 60 * 1000 // arm the next 24 h
const MAX_TIMERS_PER_REMINDER = 8

const timersByReminder = new Map<string, number[]>()

export function clearInTabTimers(reminderId: string): void {
  const timers = timersByReminder.get(reminderId)
  if (!timers) return
  for (const id of timers) clearTimeout(id)
  timersByReminder.delete(reminderId)
}

export function clearAllInTabTimers(): void {
  for (const timers of timersByReminder.values()) {
    for (const id of timers) clearTimeout(id)
  }
  timersByReminder.clear()
}

export function armInTabTimers(
  registration: ServiceWorkerRegistration | null,
  reminder: Reminder,
  now: number = Date.now(),
): number {
  clearInTabTimers(reminder.id)
  if (!reminder.active) return 0
  if (reminder.schedule.type === 'inventory_based') return 0

  const horizon = now + INTAB_HORIZON_MS
  const planned = planTriggers(reminder, new Date(now), MAX_TIMERS_PER_REMINDER)
  const due = planned.filter(
    ({ scheduledFor }) =>
      scheduledFor.getTime() > now && scheduledFor.getTime() <= horizon,
  )
  if (due.length === 0) return 0

  const timers: number[] = []
  for (const { scheduledFor } of due) {
    const delay = scheduledFor.getTime() - now
    const id = setTimeout(() => {
      void fireInTab(registration, reminder, scheduledFor)
    }, delay) as unknown as number
    timers.push(id)
  }
  timersByReminder.set(reminder.id, timers)
  return timers.length
}

async function fireInTab(
  registration: ServiceWorkerRegistration | null,
  reminder: Reminder,
  scheduledFor: Date,
): Promise<void> {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  const descriptor = buildDescriptor(reminder, scheduledFor)
  const options: NotificationOptions = {
    tag: descriptor.tag,
    body: descriptor.body,
    icon: descriptor.icon,
    data: descriptor.data,
  }
  if (registration) {
    const swOptions = options as NotificationOptions & {
      actions?: typeof descriptor.actions
    }
    swOptions.actions = descriptor.actions
    await registration.showNotification(descriptor.title, swOptions)
  } else {
    new Notification(descriptor.title, options)
  }
}

export function _peekInTabTimers(reminderId: string): number {
  return timersByReminder.get(reminderId)?.length ?? 0
}
