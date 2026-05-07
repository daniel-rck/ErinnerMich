import type { ToolEntry, ToolKey } from '../types'
import { newId } from '../ids'
import { dayKey, getDB, type StoredToolEntry } from './index'
import { broadcast } from './broadcast'

export type NewToolEntry = Omit<ToolEntry, 'id'>

export async function addToolEntry(input: NewToolEntry): Promise<ToolEntry> {
  const entry: ToolEntry = { ...input, id: newId() }
  const stored: StoredToolEntry = {
    ...entry,
    loggedAtDay: dayKey(entry.loggedAt),
  }
  const db = await getDB()
  await db.add('tool_entries', stored)
  broadcast({ type: 'tool-added', id: entry.id, toolKey: entry.toolKey })
  return entry
}

export async function deleteToolEntry(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tool_entries', id)
  broadcast({ type: 'tool-deleted', id })
}

export async function listToolEntries(options?: {
  toolKey?: ToolKey
  since?: number
  until?: number
}): Promise<ToolEntry[]> {
  const db = await getDB()
  let stored: StoredToolEntry[]
  if (options?.toolKey) {
    stored = await db.getAllFromIndex(
      'tool_entries',
      'byToolKey',
      options.toolKey,
    )
  } else if (options?.since !== undefined && options?.until !== undefined) {
    stored = await db.getAllFromIndex(
      'tool_entries',
      'byLoggedAt',
      IDBKeyRange.bound(options.since, options.until),
    )
  } else if (options?.since !== undefined) {
    stored = await db.getAllFromIndex(
      'tool_entries',
      'byLoggedAt',
      IDBKeyRange.lowerBound(options.since),
    )
  } else if (options?.until !== undefined) {
    stored = await db.getAllFromIndex(
      'tool_entries',
      'byLoggedAt',
      IDBKeyRange.upperBound(options.until),
    )
  } else {
    stored = await db.getAll('tool_entries')
  }
  let entries = stored.map(stripStored)
  if (options?.since !== undefined) {
    entries = entries.filter((e) => e.loggedAt >= options.since!)
  }
  if (options?.until !== undefined) {
    entries = entries.filter((e) => e.loggedAt <= options.until!)
  }
  return entries.sort((a, b) => b.loggedAt - a.loggedAt)
}

export async function listToolEntriesForDay(
  toolKey: ToolKey,
  day: string,
): Promise<ToolEntry[]> {
  const db = await getDB()
  const stored = await db.getAllFromIndex(
    'tool_entries',
    'byLoggedAtDay',
    day,
  )
  return stored
    .filter((e) => e.toolKey === toolKey)
    .map(stripStored)
    .sort((a, b) => b.loggedAt - a.loggedAt)
}

export async function sweepExpiredToolEntries(now: number = Date.now()): Promise<number> {
  try {
    const db = await getDB()
    const all = await db.getAll('tool_entries')
    const expired = all.filter(
      (e) => e.expiresAt !== undefined && e.expiresAt <= now,
    )
    if (expired.length === 0) return 0
    const tx = db.transaction('tool_entries', 'readwrite')
    for (const entry of expired) {
      await tx.store.delete(entry.id)
    }
    await tx.done
    broadcast({ type: 'tool-deleted', id: '*' })
    return expired.length
  } catch {
    return 0
  }
}

function stripStored(stored: StoredToolEntry): ToolEntry {
  const { loggedAtDay: _day, ...rest } = stored
  return rest
}
