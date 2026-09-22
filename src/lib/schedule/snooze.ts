import type { ReminderEvent, ReminderEventAction } from "../types";

// Actions that settle an occurrence. Progress ticks and "missed" markers don't.
const SETTLING: ReadonlySet<ReminderEventAction> = new Set([
  "completed",
  "snoozed",
  "skipped",
  "dismissed",
]);

export type PendingSnooze = {
  /** When the snoozed notification should come back. */
  until: number;
  /**
   * The occurrence that was snoozed (`ReminderEvent.scheduledFor`), or
   * undefined for a snooze without one. Keeps a snoozed 08:00 from moving or
   * suppressing the 20:00 slot of the same reminder.
   */
  slot: number | undefined;
};

/**
 * Snoozes that are still pending, one per occurrence: the newest settling
 * event of each slot decides — a later completion/skip of the same slot
 * cancels its snooze, a snooze that ran out is gone.
 */
export function pendingSnoozes(events: readonly ReminderEvent[], now: number): PendingSnooze[] {
  const latestBySlot = new Map<number | undefined, { event: ReminderEvent; ts: number }>();
  for (const event of events) {
    if (!SETTLING.has(event.action)) continue;
    const ts = event.triggeredAt ?? event.scheduledFor ?? 0;
    const prev = latestBySlot.get(event.scheduledFor);
    if (!prev || ts >= prev.ts) latestBySlot.set(event.scheduledFor, { event, ts });
  }
  const out: PendingSnooze[] = [];
  for (const [slot, { event }] of latestBySlot) {
    if (event.action !== "snoozed" || event.snoozeUntil === undefined) continue;
    if (event.snoozeUntil > now) out.push({ until: event.snoozeUntil, slot });
  }
  return out.toSorted((a, b) => a.until - b.until);
}
