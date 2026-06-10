import {
  dayKey,
  getDB,
  type StoredMoodEntry,
  type StoredReminderEvent,
  type StoredToolEntry,
} from "../db";
import { broadcast } from "../db/broadcast";
import type { Inventory, MoodEntry, Reminder, ReminderEvent, ToolEntry } from "../types";

// v2 added `toolEntries` (wellness tool history). v1 exports are still
// accepted on import — the missing field defaults to an empty array.
export const EXPORT_SCHEMA_VERSION = 2;

export interface ErinnermichExport {
  schema: "erinnermich";
  schemaVersion: number;
  exportedAt: number;
  reminders: Reminder[];
  events: ReminderEvent[];
  inventories: Inventory[];
  moodEntries: MoodEntry[];
  toolEntries: ToolEntry[];
}

export interface ImportSummary {
  reminders: number;
  events: number;
  inventories: number;
  moodEntries: number;
  toolEntries: number;
}

function stripStoredEvent(stored: StoredReminderEvent): ReminderEvent {
  const { triggeredAtDay: _day, ...rest } = stored;
  return rest;
}

function stripStoredMood(stored: StoredMoodEntry): MoodEntry {
  const { loggedAtDay: _day, ...rest } = stored;
  return rest;
}

function stripStoredTool(stored: StoredToolEntry): ToolEntry {
  const { loggedAtDay: _day, ...rest } = stored;
  return rest;
}

export async function exportAll(): Promise<ErinnermichExport> {
  const db = await getDB();
  const [reminders, events, inventories, moods, tools] = await Promise.all([
    db.getAll("reminders"),
    db.getAll("events"),
    db.getAll("inventories"),
    db.getAll("mood_entries"),
    db.getAll("tool_entries"),
  ]);
  return {
    schema: "erinnermich",
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: Date.now(),
    reminders,
    events: events.map(stripStoredEvent),
    inventories,
    moodEntries: moods.map(stripStoredMood),
    toolEntries: tools.map(stripStoredTool),
  };
}

export interface ImportOptions {
  /** 'replace' clears existing stores first; 'merge' keeps existing rows. */
  mode?: "replace" | "merge";
}

export class ImportSchemaError extends Error {}

export function parseExport(raw: unknown): ErinnermichExport {
  if (!raw || typeof raw !== "object") {
    throw new ImportSchemaError("Datei ist kein gültiges JSON-Objekt.");
  }
  const obj = raw as Record<string, unknown>;
  if (obj.schema !== "erinnermich") {
    throw new ImportSchemaError(`Unbekanntes Schema „${String(obj.schema)}".`);
  }
  if (typeof obj.schemaVersion !== "number") {
    throw new ImportSchemaError("schemaVersion fehlt oder ist kein Integer.");
  }
  if (obj.schemaVersion > EXPORT_SCHEMA_VERSION) {
    throw new ImportSchemaError(
      `schemaVersion=${obj.schemaVersion} ist neuer als unterstützt (${EXPORT_SCHEMA_VERSION}).`,
    );
  }
  for (const key of ["reminders", "events", "inventories", "moodEntries"] as const) {
    if (!Array.isArray(obj[key])) {
      throw new ImportSchemaError(`Feld „${key}" muss ein Array sein.`);
    }
  }
  // `toolEntries` came with schemaVersion 2. v1 exports omit it entirely —
  // accept those and treat tool history as empty. When present it must be valid.
  if (obj.toolEntries === undefined) {
    obj.toolEntries = [];
  } else if (!Array.isArray(obj.toolEntries)) {
    throw new ImportSchemaError('Feld „toolEntries" muss ein Array sein.');
  }
  return obj as unknown as ErinnermichExport;
}

export async function importAll(
  data: ErinnermichExport,
  options: ImportOptions = {},
): Promise<ImportSummary> {
  const mode = options.mode ?? "merge";
  const db = await getDB();
  const tx = db.transaction(
    ["reminders", "events", "inventories", "mood_entries", "tool_entries"],
    "readwrite",
  );

  if (mode === "replace") {
    await tx.objectStore("reminders").clear();
    await tx.objectStore("events").clear();
    await tx.objectStore("inventories").clear();
    await tx.objectStore("mood_entries").clear();
    await tx.objectStore("tool_entries").clear();
  }

  for (const reminder of data.reminders) {
    await tx.objectStore("reminders").put(reminder);
  }
  for (const event of data.events) {
    const stored: StoredReminderEvent = {
      ...event,
      triggeredAtDay: event.triggeredAt ? dayKey(event.triggeredAt) : undefined,
    };
    await tx.objectStore("events").put(stored);
  }
  for (const inventory of data.inventories) {
    await tx.objectStore("inventories").put(inventory);
  }
  for (const mood of data.moodEntries) {
    const stored: StoredMoodEntry = {
      ...mood,
      loggedAtDay: dayKey(mood.loggedAt),
    };
    await tx.objectStore("mood_entries").put(stored);
  }
  const toolEntries = data.toolEntries ?? [];
  for (const tool of toolEntries) {
    const stored: StoredToolEntry = {
      ...tool,
      loggedAtDay: dayKey(tool.loggedAt),
    };
    await tx.objectStore("tool_entries").put(stored);
  }

  await tx.done;
  // `db-cleared` doubles as "reload everything": every hook re-fetches and the
  // scheduler clears + re-arms all triggers — exactly right after an import,
  // which can touch every store at once (also in merge mode).
  broadcast({ type: "db-cleared" });

  return {
    reminders: data.reminders.length,
    events: data.events.length,
    inventories: data.inventories.length,
    moodEntries: data.moodEntries.length,
    toolEntries: toolEntries.length,
  };
}

export function exportFilename(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `erinnermich-${yyyy}-${mm}-${dd}.json`;
}

/**
 * Exports the full DB snapshot and triggers a JSON file download.
 * Returns the snapshot so callers can show a summary.
 */
export async function downloadExport(): Promise<ErinnermichExport> {
  const snap = await exportAll();
  const blob = new Blob([JSON.stringify(snap, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return snap;
}
