import { newId } from "../ids";
import type { Reminder, ReminderKind } from "../types";
import { broadcast } from "./broadcast";
import { getDB } from "./index";

export type NewReminder = Omit<Reminder, "id" | "createdAt" | "updatedAt">;

export async function createReminder(input: NewReminder): Promise<Reminder> {
  const now = Date.now();
  const reminder: Reminder = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDB();
  await db.add("reminders", reminder);
  broadcast({ type: "reminder-changed", id: reminder.id });
  return reminder;
}

export async function updateReminder(
  id: string,
  patch: Partial<Omit<Reminder, "id" | "createdAt">>,
): Promise<Reminder> {
  const db = await getDB();
  const existing = await db.get("reminders", id);
  if (!existing) throw new Error(`Reminder ${id} nicht gefunden`);
  const updated: Reminder = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  await db.put("reminders", updated);
  broadcast({ type: "reminder-changed", id });
  return updated;
}

export async function getReminder(id: string): Promise<Reminder | undefined> {
  const db = await getDB();
  return db.get("reminders", id);
}

export async function listReminders(filter?: {
  kind?: ReminderKind;
  activeOnly?: boolean;
  includeArchived?: boolean;
}): Promise<Reminder[]> {
  const db = await getDB();
  const all = filter?.kind
    ? await db.getAllFromIndex("reminders", "byKind", filter.kind)
    : await db.getAll("reminders");
  let filtered = all;
  if (!filter?.includeArchived) {
    filtered = filtered.filter((r) => r.archivedAt == null);
  }
  if (filter?.activeOnly) {
    filtered = filtered.filter((r) => r.active);
  }
  return filtered;
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["reminders", "events", "inventories"], "readwrite");
  await tx.objectStore("reminders").delete(id);
  const eventIds = await tx.objectStore("events").index("byReminderId").getAllKeys(id);
  for (const eid of eventIds) {
    await tx.objectStore("events").delete(eid);
  }
  await tx.objectStore("inventories").delete(id);
  await tx.done;
  broadcast({ type: "reminder-deleted", id });
}

export async function setReminderActive(id: string, active: boolean): Promise<void> {
  await updateReminder(id, { active });
}

/**
 * Archiving is the grace period of a delete: the reminder disappears from
 * every view and stops notifying, and is hard-deleted once the undo window
 * closes. Returns the previous `active` flag so an undo can restore it.
 */
export async function archiveReminder(id: string): Promise<boolean> {
  const before = await getReminder(id);
  await updateReminder(id, { archivedAt: Date.now(), active: false });
  return before?.active ?? true;
}

/** Undo for `archiveReminder`; `active` defaults to on for older callers. */
export async function restoreReminder(id: string, active = true): Promise<void> {
  await updateReminder(id, { archivedAt: undefined, active });
}

/**
 * Hard-deletes reminders archived before `cutoff`. A delete whose grace
 * timer never ran (tab closed within the undo window) would otherwise leave
 * a record no view can show.
 */
export async function purgeArchivedReminders(cutoff: number): Promise<number> {
  const stale = (await listReminders({ includeArchived: true })).filter(
    (r) => r.archivedAt != null && r.archivedAt < cutoff,
  );
  for (const r of stale) await deleteReminder(r.id);
  return stale.length;
}
