import { describe, expect, it } from 'vitest'
import { DB_NAME, DB_VERSION, getDB } from '..'

describe('DB-Migration v0 → v2', () => {
  it('erzeugt alle ObjectStores und Indizes', async () => {
    const db = await getDB()
    expect(db.name).toBe(DB_NAME)
    expect(db.version).toBe(DB_VERSION)

    expect([...db.objectStoreNames].sort()).toEqual([
      'events',
      'inventories',
      'mood_entries',
      'reminders',
      'tool_entries',
    ])

    const tx = db.transaction(
      ['reminders', 'events', 'mood_entries', 'tool_entries'],
      'readonly',
    )
    expect([...tx.objectStore('reminders').indexNames].sort()).toEqual([
      'byCategory',
      'byKind',
    ])
    expect([...tx.objectStore('events').indexNames].sort()).toEqual([
      'byReminderId',
      'byTriggeredAtDay',
    ])
    expect([...tx.objectStore('mood_entries').indexNames].sort()).toEqual([
      'byLoggedAt',
      'byLoggedAtDay',
      'byReminderId',
    ])
    expect([...tx.objectStore('tool_entries').indexNames].sort()).toEqual([
      'byLoggedAt',
      'byLoggedAtDay',
      'byToolKey',
    ])
    await tx.done
  })
})
