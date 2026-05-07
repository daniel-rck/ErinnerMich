import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  Inventory,
  MoodEntry,
  Reminder,
  ReminderEvent,
  ToolEntry,
} from '../types'

export const DB_NAME = 'erinnermich'
export const DB_VERSION = 2

export interface ErinnermichDB extends DBSchema {
  reminders: {
    key: string
    value: Reminder
    indexes: {
      byKind: string
      byCategory: string
    }
  }
  events: {
    key: string
    value: StoredReminderEvent
    indexes: {
      byReminderId: string
      byTriggeredAtDay: string
    }
  }
  inventories: {
    key: string
    value: Inventory
  }
  mood_entries: {
    key: string
    value: StoredMoodEntry
    indexes: {
      byLoggedAt: number
      byLoggedAtDay: string
      byReminderId: string
    }
  }
  tool_entries: {
    key: string
    value: StoredToolEntry
    indexes: {
      byToolKey: string
      byLoggedAt: number
      byLoggedAtDay: string
    }
  }
}

export type StoredReminderEvent = ReminderEvent & {
  triggeredAtDay?: string
}

export type StoredMoodEntry = MoodEntry & {
  loggedAtDay: string
}

export type StoredToolEntry = ToolEntry & {
  loggedAtDay: string
}

export function dayKey(timestamp: number): string {
  const d = new Date(timestamp)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

let dbPromise: Promise<IDBPDatabase<ErinnermichDB>> | null = null

export function getDB(): Promise<IDBPDatabase<ErinnermichDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ErinnermichDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const reminders = db.createObjectStore('reminders', { keyPath: 'id' })
          reminders.createIndex('byKind', 'kind')
          reminders.createIndex('byCategory', 'category')

          const events = db.createObjectStore('events', { keyPath: 'id' })
          events.createIndex('byReminderId', 'reminderId')
          events.createIndex('byTriggeredAtDay', 'triggeredAtDay')

          db.createObjectStore('inventories', { keyPath: 'reminderId' })

          const mood = db.createObjectStore('mood_entries', { keyPath: 'id' })
          mood.createIndex('byLoggedAt', 'loggedAt')
          mood.createIndex('byLoggedAtDay', 'loggedAtDay')
          mood.createIndex('byReminderId', 'reminderId')
        }
        if (oldVersion < 2) {
          const tools = db.createObjectStore('tool_entries', { keyPath: 'id' })
          tools.createIndex('byToolKey', 'toolKey')
          tools.createIndex('byLoggedAt', 'loggedAt')
          tools.createIndex('byLoggedAtDay', 'loggedAtDay')
        }
      },
      blocked() {
        // Eine andere Tab-Instanz hält noch eine ältere Version offen
        console.warn('[erinnermich] DB upgrade blocked')
      },
      blocking() {
        // Diese Connection blockiert ein Upgrade in einer anderen Tab-Instanz
        void getDB().then((db) => db.close())
        dbPromise = null
      },
    })
  }
  return dbPromise
}

export async function _resetDBForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
  }
  dbPromise = null
}
