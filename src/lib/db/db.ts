import type { DBSchema } from "idb";
import type { Inventory, MoodEntry, Reminder, ReminderEvent, ToolEntry } from "../types";
import { clearStores } from "./mutations.ts";
import { createDBOpener } from "./open.ts";

// Never rename: a new name starts every user with an empty database.
export const DB_NAME = "erinnermich";
// Bump with every schema change, together with a new `if (oldVersion < N)` step.
export const DB_VERSION = 2;

export interface ErinnermichDB extends DBSchema {
  reminders: {
    key: string;
    value: Reminder;
    indexes: {
      byKind: string;
      byCategory: string;
    };
  };
  events: {
    key: string;
    value: StoredReminderEvent;
    indexes: {
      byReminderId: string;
      byTriggeredAtDay: string;
    };
  };
  inventories: {
    key: string;
    value: Inventory;
  };
  mood_entries: {
    key: string;
    value: StoredMoodEntry;
    indexes: {
      byLoggedAt: number;
      byLoggedAtDay: string;
      byReminderId: string;
    };
  };
  tool_entries: {
    key: string;
    value: StoredToolEntry;
    indexes: {
      byToolKey: string;
      byLoggedAt: number;
      byLoggedAtDay: string;
    };
  };
}

export type StoredReminderEvent = ReminderEvent & {
  triggeredAtDay?: string;
};

export type StoredMoodEntry = MoodEntry & {
  loggedAtDay: string;
};

export type StoredToolEntry = ToolEntry & {
  loggedAtDay: string;
};

export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * The shared connection (web-base `createDBOpener`): opened once, reopened when
 * the browser drops it, never caching a failed open. When another tab upgrades
 * to a newer schema, this tab closes its connection and reloads.
 */
export const getDB = createDBOpener<ErinnermichDB>({
  name: DB_NAME,
  version: DB_VERSION,
  upgrade(db, oldVersion) {
    // The migration ladder. Never edit a step that has shipped: bump
    // DB_VERSION and add a new `if (oldVersion < N)` below the last one.
    if (oldVersion < 1) {
      const reminders = db.createObjectStore("reminders", { keyPath: "id" });
      reminders.createIndex("byKind", "kind");
      reminders.createIndex("byCategory", "category");

      const events = db.createObjectStore("events", { keyPath: "id" });
      events.createIndex("byReminderId", "reminderId");
      events.createIndex("byTriggeredAtDay", "triggeredAtDay");

      db.createObjectStore("inventories", { keyPath: "reminderId" });

      const mood = db.createObjectStore("mood_entries", { keyPath: "id" });
      mood.createIndex("byLoggedAt", "loggedAt");
      mood.createIndex("byLoggedAtDay", "loggedAtDay");
      mood.createIndex("byReminderId", "reminderId");
    }
    if (oldVersion < 2) {
      const tools = db.createObjectStore("tool_entries", { keyPath: "id" });
      tools.createIndex("byToolKey", "toolKey");
      tools.createIndex("byLoggedAt", "loggedAt");
      tools.createIndex("byLoggedAtDay", "loggedAtDay");
    }
  },
});

/**
 * Wipe every store (tests' `afterEach`). The app's own hooks listen on the
 * typed BroadcastChannel in broadcast.ts, not on web-base's mutation channels —
 * callers that need them to refetch broadcast `db-cleared` themselves.
 */
export async function clearAll(): Promise<void> {
  await clearStores(await getDB());
}
