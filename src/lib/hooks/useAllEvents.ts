import { getDB, type StoredReminderEvent } from "../db";
import type { ReminderEvent } from "../types";
import { useDbQuery } from "./useDbQuery";

function strip(stored: StoredReminderEvent): ReminderEvent {
  const { triggeredAtDay: _day, ...rest } = stored;
  return rest;
}

async function loadAllEvents(): Promise<ReminderEvent[]> {
  const db = await getDB();
  const stored = await db.getAll("events");
  return stored.map(strip);
}

export function useAllEvents(): {
  events: ReminderEvent[];
  loading: boolean;
} {
  const { data, loading } = useDbQuery<ReminderEvent[]>(
    loadAllEvents,
    [],
    (message) =>
      message.type === "event-added" ||
      message.type === "event-deleted" ||
      message.type === "reminder-deleted",
    [],
  );
  return { events: data, loading };
}
