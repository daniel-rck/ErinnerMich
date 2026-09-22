import type { ReminderEvent, ReminderEventAction } from "../types";

// Actions that settle an occurrence: the newest of these decides whether a
// snooze is still pending. Progress ticks and "missed" markers don't count.
const SETTLING: ReadonlySet<ReminderEventAction> = new Set([
  "completed",
  "snoozed",
  "skipped",
  "dismissed",
]);

/**
 * When the newest settling event is a snooze that hasn't run out yet, returns
 * its `snoozeUntil`; otherwise null (completed/skipped after the snooze, or
 * the snooze already elapsed).
 */
export function pendingSnoozeUntil(events: readonly ReminderEvent[], now: number): number | null {
  let latest: ReminderEvent | undefined;
  let latestTs = Number.NEGATIVE_INFINITY;
  for (const event of events) {
    if (!SETTLING.has(event.action)) continue;
    const ts = event.triggeredAt ?? event.scheduledFor ?? 0;
    if (ts >= latestTs) {
      latest = event;
      latestTs = ts;
    }
  }
  if (latest?.action !== "snoozed" || latest.snoozeUntil === undefined) return null;
  return latest.snoozeUntil > now ? latest.snoozeUntil : null;
}
