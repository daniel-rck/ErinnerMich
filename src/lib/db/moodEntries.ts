import type { MoodEntry } from '../types'
import { newId } from '../ids'
import { dayKey, getDB, type StoredMoodEntry } from './index'
import { broadcast } from './broadcast'

export type NewMoodEntry = Omit<MoodEntry, 'id'>

export async function addMoodEntry(input: NewMoodEntry): Promise<MoodEntry> {
  const entry: MoodEntry = { ...input, id: newId() }
  const stored: StoredMoodEntry = {
    ...entry,
    loggedAtDay: dayKey(entry.loggedAt),
  }
  const db = await getDB()
  await db.add('mood_entries', stored)
  broadcast({ type: 'mood-added', id: entry.id })
  return entry
}

export async function deleteMoodEntry(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('mood_entries', id)
  broadcast({ type: 'mood-deleted', id })
}

export async function listMoodEntriesInRange(
  fromMs: number,
  toMs: number,
): Promise<MoodEntry[]> {
  const db = await getDB()
  const range = IDBKeyRange.bound(fromMs, toMs)
  const stored = await db.getAllFromIndex('mood_entries', 'byLoggedAt', range)
  return stored.map(stripStored).sort((a, b) => b.loggedAt - a.loggedAt)
}

export async function listMoodEntriesForDay(
  day: string,
): Promise<MoodEntry[]> {
  const db = await getDB()
  const stored = await db.getAllFromIndex(
    'mood_entries',
    'byLoggedAtDay',
    day,
  )
  return stored.map(stripStored).sort((a, b) => b.loggedAt - a.loggedAt)
}

export async function dailyMoodAverage(
  day: string,
): Promise<{ avgMood: number; avgEnergy: number | null; count: number }> {
  const entries = await listMoodEntriesForDay(day)
  if (entries.length === 0) {
    return { avgMood: 0, avgEnergy: null, count: 0 }
  }
  const moodSum = entries.reduce((acc, e) => acc + e.mood, 0)
  const energyValues = entries
    .map((e) => e.energy)
    .filter((v): v is NonNullable<typeof v> => v !== undefined)
  const energySum = energyValues.reduce((acc, v) => acc + v, 0)
  return {
    avgMood: moodSum / entries.length,
    avgEnergy: energyValues.length ? energySum / energyValues.length : null,
    count: entries.length,
  }
}

function stripStored(stored: StoredMoodEntry): MoodEntry {
  const { loggedAtDay: _day, ...rest } = stored
  return rest
}
