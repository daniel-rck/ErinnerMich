import { addEvent } from '../db/events'
import { addMoodEntry } from '../db/moodEntries'
import { adjustInventory } from '../db/inventories'
import { getReminder, updateReminder } from '../db/reminders'
import type { MoodValue, Reminder } from '../types'

export interface NotificationActionPayload {
  action: string
  reminderId: string
  kind: 'reminder' | 'habit' | 'mood'
  scheduledFor: number
}

export function isNotificationActionMessage(
  data: unknown,
): data is NotificationActionPayload & { type: 'erinnermich:notification-action' } {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    d.type === 'erinnermich:notification-action' &&
    typeof d.action === 'string' &&
    typeof d.reminderId === 'string' &&
    typeof d.scheduledFor === 'number' &&
    (d.kind === 'reminder' || d.kind === 'habit' || d.kind === 'mood')
  )
}

export async function applyNotificationAction(
  payload: NotificationActionPayload,
): Promise<void> {
  const reminder = await getReminder(payload.reminderId)
  if (!reminder) return

  switch (payload.action) {
    case 'done':
      await markCompleted(reminder, payload.scheduledFor)
      return
    case '+1':
      await markProgressPlusOne(reminder, payload.scheduledFor)
      return
    case 'snooze-10':
      await markSnoozed(reminder, payload.scheduledFor, 10)
      return
    case 'snooze-30':
      await markSnoozed(reminder, payload.scheduledFor, 30)
      return
    case 'snooze-60':
      await markSnoozed(reminder, payload.scheduledFor, 60)
      return
    case 'skip':
      await markSkipped(reminder, payload.scheduledFor)
      return
    case 'mood-1':
    case 'mood-2':
    case 'mood-3':
    case 'mood-4':
    case 'mood-5':
      await logMood(reminder, payload.action)
      return
    case 'open':
    default:
      return
  }
}

async function markCompleted(
  reminder: Reminder,
  scheduledFor: number,
): Promise<void> {
  const now = Date.now()
  await addEvent({
    reminderId: reminder.id,
    action: 'completed',
    triggeredAt: now,
    scheduledFor,
  })
  if (reminder.schedule.type === 'elapsed') {
    await updateReminder(reminder.id, {
      schedule: { ...reminder.schedule, lastDone: now },
    })
  }
  if (reminder.kind === 'reminder') {
    await maybeDecrementInventory(reminder)
  }
}

async function markProgressPlusOne(
  reminder: Reminder,
  scheduledFor: number,
): Promise<void> {
  const unit =
    reminder.goal && reminder.goal.type === 'count'
      ? reminder.goal.unit
      : reminder.goal && reminder.goal.type === 'duration'
        ? 'min'
        : ''
  await addEvent({
    reminderId: reminder.id,
    action: 'progress',
    triggeredAt: Date.now(),
    scheduledFor,
    progress: { value: 1, unit },
  })
}

async function markSnoozed(
  reminder: Reminder,
  scheduledFor: number,
  minutes: number,
): Promise<void> {
  const now = Date.now()
  await addEvent({
    reminderId: reminder.id,
    action: 'snoozed',
    triggeredAt: now,
    scheduledFor,
    snoozeUntil: now + minutes * 60_000,
  })
}

async function markSkipped(
  reminder: Reminder,
  scheduledFor: number,
): Promise<void> {
  await addEvent({
    reminderId: reminder.id,
    action: 'skipped',
    triggeredAt: Date.now(),
    scheduledFor,
  })
}

async function logMood(reminder: Reminder, action: string): Promise<void> {
  const moodValue = Number(action.split('-')[1]) as MoodValue
  if (moodValue < 1 || moodValue > 5) return
  await addMoodEntry({
    reminderId: reminder.id,
    loggedAt: Date.now(),
    mood: moodValue,
  })
}

async function maybeDecrementInventory(reminder: Reminder): Promise<void> {
  // If the user has an inventory tracked for this reminder (e.g. medication),
  // mark a completion as one unit consumed.
  const result = await adjustInventory(reminder.id, -1)
  if (result === undefined) return
}

/**
 * Reads `?notif=<action>|<reminderId>|<scheduledFor>|<kind>` once on app start
 * so cold-start clicks (no live page) can still apply their action.
 */
export function consumeUrlNotifAction(
  href: string = window.location.href,
): NotificationActionPayload | null {
  try {
    const url = new URL(href)
    const raw = url.searchParams.get('notif')
    if (!raw) return null
    const [action, reminderId, scheduledFor, kind] = raw.split('|')
    if (!action || !reminderId || !scheduledFor || !kind) return null
    if (kind !== 'reminder' && kind !== 'habit' && kind !== 'mood') return null
    url.searchParams.delete('notif')
    if (typeof history !== 'undefined') {
      history.replaceState(null, '', url.pathname + url.search + url.hash)
    }
    return {
      action,
      reminderId,
      scheduledFor: Number(scheduledFor),
      kind,
    }
  } catch {
    return null
  }
}
