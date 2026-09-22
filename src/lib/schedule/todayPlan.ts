import type { Reminder, ReminderEvent } from "../types";
import { nextNOccurrences } from "./nextOccurrence";
import { pendingSnoozeUntil } from "./snooze";

export type TodayBucket = "overdue" | "now" | "later" | "done";

export type TodayItem = {
  reminder: Reminder;
  /** The slot's scheduled time (or the snooze end for a snoozed slot). */
  scheduledFor: Date;
  bucket: TodayBucket;
  snoozed: boolean;
};

/** A slot within ±30 min of now counts as "jetzt". */
export const NOW_WINDOW_MS = 30 * 60_000;
// Upper bound for slots per reminder and day — a guard against schedules
// that would otherwise list dozens of cards.
const MAX_SLOTS_PER_DAY = 12;

const HANDLED = new Set(["completed", "skipped"]);

function bucketFor(ts: number, now: number): TodayBucket {
  const delta = ts - now;
  if (delta < -NOW_WINDOW_MS) return "overdue";
  if (delta <= NOW_WINDOW_MS) return "now";
  return "later";
}

/** Every slot of `reminder` that falls on the day of `now`. */
function slotsToday(reminder: Reminder, dayStart: number, dayEnd: number): number[] {
  // `nextOccurrence` is strictly after `from`, so start 1 ms early to keep a
  // 00:00 slot.
  return nextNOccurrences(reminder.schedule, new Date(dayStart - 1), MAX_SLOTS_PER_DAY)
    .map((d) => d.getTime())
    .filter((ts) => ts >= dayStart && ts <= dayEnd);
}

/**
 * Pure planner behind the Today timeline. Unlike the previous "first slot
 * only" logic it lists every slot of the day (a daily 08:00 + 20:00 reminder
 * shows twice), matches completions per slot via `scheduledFor`, and moves a
 * snoozed slot to its snooze end.
 *
 * Interval reminders are the exception: listing every "alle 90 min" slot would
 * flood the page, so they show one card — the latest slot not yet handled, or
 * the next upcoming one.
 */
export function planToday(
  reminders: readonly Reminder[],
  events: readonly ReminderEvent[],
  now: Date,
): TodayItem[] {
  const nowMs = now.getTime();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const dayStart = start.getTime();
  const dayEnd = end.getTime();

  const eventsByReminder = new Map<string, ReminderEvent[]>();
  for (const e of events) {
    const list = eventsByReminder.get(e.reminderId) ?? [];
    list.push(e);
    eventsByReminder.set(e.reminderId, list);
  }

  const items: TodayItem[] = [];
  for (const reminder of reminders) {
    if (!reminder.active || reminder.archivedAt != null) continue;
    const own = eventsByReminder.get(reminder.id) ?? [];
    let slots: number[];
    try {
      slots = slotsToday(reminder, dayStart, dayEnd);
    } catch {
      continue; // an invalid schedule shows nothing rather than breaking the page
    }
    if (slots.length === 0) continue;

    // Handled events of today, oldest first; exact `scheduledFor` matches win,
    // the rest (legacy events without a slot) fill the earliest open slots.
    const handled = own
      .filter((e) => HANDLED.has(e.action))
      .filter((e) => {
        const ts = e.triggeredAt ?? e.scheduledFor;
        return ts != null && ts >= dayStart && ts <= dayEnd;
      })
      .toSorted((a, b) => (a.triggeredAt ?? 0) - (b.triggeredAt ?? 0));
    const done = new Set<number>();
    const unmatched: ReminderEvent[] = [];
    for (const e of handled) {
      if (
        e.scheduledFor !== undefined &&
        slots.includes(e.scheduledFor) &&
        !done.has(e.scheduledFor)
      ) {
        done.add(e.scheduledFor);
      } else {
        unmatched.push(e);
      }
    }
    for (const _ of unmatched) {
      const open = slots.find((ts) => !done.has(ts));
      if (open === undefined) break;
      done.add(open);
    }

    let visible = slots;
    if (reminder.schedule.type === "interval") {
      const open = slots.filter((ts) => !done.has(ts));
      const due = open.filter((ts) => ts <= nowMs);
      const pick = due.at(-1) ?? open[0];
      visible = pick === undefined ? [] : [pick];
      // A finished interval day has nothing open left: show one "done" card.
      if (visible.length === 0) visible = slots.slice(-1);
    }

    const snoozeUntil = pendingSnoozeUntil(own, nowMs);
    let snoozedShown = false;
    for (const ts of visible) {
      if (done.has(ts)) {
        items.push({ reminder, scheduledFor: new Date(ts), bucket: "done", snoozed: false });
        continue;
      }
      // A snoozed slot that is already due moves to the snooze end (once).
      if (snoozeUntil !== null && ts <= nowMs + NOW_WINDOW_MS) {
        if (snoozedShown) continue;
        snoozedShown = true;
        items.push({
          reminder,
          scheduledFor: new Date(snoozeUntil),
          bucket: bucketFor(snoozeUntil, nowMs),
          snoozed: true,
        });
        continue;
      }
      items.push({
        reminder,
        scheduledFor: new Date(ts),
        bucket: bucketFor(ts, nowMs),
        snoozed: false,
      });
    }
  }
  return items.toSorted((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
}

/** Whether a reminder has at least one slot today (for the hero's counters). */
export function isDueToday(reminder: Reminder, now: Date): boolean {
  return planToday([reminder], [], now).length > 0;
}
