import type { Schedule } from "../types";
import { addDays } from "./helpers";

type ElapsedSchedule = Extract<Schedule, { type: "elapsed" }>;

/**
 * For "every N days since last done" reminders.
 *
 * - With `lastDone`: next = lastDone + days. If that's already in the past
 *   relative to `from`, returns the past value (so the UI can render as
 *   "überfällig"). The renderer decides if it's a notification or just a
 *   visual cue.
 * - Without `lastDone`: anchor at `from + days` (first scheduling).
 */
export function nextElapsedOccurrence(schedule: ElapsedSchedule, from: Date): Date {
  if (schedule.days <= 0) {
    throw new Error("elapsed.days muss > 0 sein");
  }
  // Calendar days keep the wall-clock time across a DST switch.
  if (schedule.lastDone !== undefined) {
    return addDays(new Date(schedule.lastDone), schedule.days);
  }
  return addDays(from, schedule.days);
}
