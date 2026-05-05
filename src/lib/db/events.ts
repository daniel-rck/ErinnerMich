import type { ReminderEvent } from '../types'
import { newId } from '../ids'
import { dayKey, getDB, type StoredReminderEvent } from './index'
import { broadcast } from './broadcast'

export type NewReminderEvent = Omit<ReminderEvent, 'id'>

export async function addEvent(
  input: NewReminderEvent,
): Promise<ReminderEvent> {
  const event: ReminderEvent = { ...input, id: newId() }
  const stored: StoredReminderEvent = {
    ...event,
    triggeredAtDay: event.triggeredAt ? dayKey(event.triggeredAt) : undefined,
  }
  const db = await getDB()
  await db.add('events', stored)
  broadcast({ type: 'event-added', reminderId: event.reminderId })
  return event
}

export async function listEventsForReminder(
  reminderId: string,
): Promise<ReminderEvent[]> {
  const db = await getDB()
  const events = await db.getAllFromIndex('events', 'byReminderId', reminderId)
  return events.map(stripStored).sort((a, b) => {
    const ta = a.triggeredAt ?? a.scheduledFor ?? 0
    const tb = b.triggeredAt ?? b.scheduledFor ?? 0
    return tb - ta
  })
}

export async function listEventsForDay(
  day: string,
): Promise<ReminderEvent[]> {
  const db = await getDB()
  const events = await db.getAllFromIndex('events', 'byTriggeredAtDay', day)
  return events.map(stripStored)
}

/**
 * Aggregate progress (count of completions / sum of progress values)
 * for a single reminder on a single calendar day.
 */
export async function dailyProgress(
  reminderId: string,
  date: number | string,
): Promise<{ completions: number; sum: number; events: ReminderEvent[] }> {
  const day = typeof date === 'string' ? date : dayKey(date)
  const db = await getDB()
  const events = await db.getAllFromIndex('events', 'byTriggeredAtDay', day)
  const filtered = events
    .filter((e) => e.reminderId === reminderId)
    .map(stripStored)
  const completions = filtered.filter((e) => e.action === 'completed').length
  const sum = filtered.reduce((acc, e) => acc + (e.progress?.value ?? 0), 0)
  return { completions, sum, events: filtered }
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDB()
  const event = await db.get('events', id)
  await db.delete('events', id)
  if (event) {
    broadcast({ type: 'event-added', reminderId: event.reminderId })
  }
}

function stripStored(stored: StoredReminderEvent): ReminderEvent {
  const { triggeredAtDay: _day, ...rest } = stored
  return rest
}
