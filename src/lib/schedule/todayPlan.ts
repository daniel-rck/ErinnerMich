import type { Reminder, ReminderEvent } from "../types";
import { nextNOccurrences } from "./nextOccurrence";
import { pendingSnoozes } from "./snooze";

export type TodayBucket = "overdue" | "now" | "later" | "done";

export type TodayItem = {
  reminder: Reminder;
  /** The occurrence itself — what completing or snoozing the card refers to. */
  scheduledFor: Date;
  /** When the card is due: the slot, or its snooze end. Buckets and sorting use this. */
  displayAt: Date;
  bucket: TodayBucket;
  snoozed: boolean;
};

/** A slot within ±30 min of now counts as "jetzt". */
export const NOW_WINDOW_MS = 30 * 60_000;
// Upper bound for slots per reminder and day — a guard against schedules
// that would otherwise list dozens of cards. Interval reminders collapse to
// one card anyway, so they get every slot of the day (a 30-minute interval
// capped at 12 slots stopped at 06:00 and showed that instead of noon's).
const MAX_SLOTS_PER_DAY = 12;
const MINUTES_PER_DAY = 24 * 60;

function slotLimit(reminder: Reminder): number {
  if (reminder.schedule.type !== "interval") return MAX_SLOTS_PER_DAY;
  const minutes = Math.max(1, reminder.schedule.minutes);
  return Math.min(MINUTES_PER_DAY + 1, Math.ceil(MINUTES_PER_DAY / minutes) + 1);
}

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
  // 00:00 slot — except for intervals, which count from `from` itself and
  // would land 1 ms before every full half hour.
  const from = reminder.schedule.type === "interval" ? dayStart : dayStart - 1;
  return nextNOccurrences(reminder.schedule, new Date(from), slotLimit(reminder))
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

    // A pending snooze moves its own slot; one without a slot (legacy) takes
    // the earliest due slot. Other slots of the reminder stay where they are.
    const snoozes = pendingSnoozes(own, nowMs);
    const bySlot = new Map(
      snoozes.filter((z) => z.slot !== undefined).map((z) => [z.slot, z.until]),
    );
    let unslotted = snoozes.find((z) => z.slot === undefined)?.until;
    for (const ts of visible) {
      const slot = new Date(ts);
      if (done.has(ts)) {
        items.push({
          reminder,
          scheduledFor: slot,
          displayAt: slot,
          bucket: "done",
          snoozed: false,
        });
        continue;
      }
      let until = bySlot.get(ts);
      if (until === undefined && unslotted !== undefined && ts <= nowMs + NOW_WINDOW_MS) {
        until = unslotted;
        unslotted = undefined;
      }
      if (until !== undefined) {
        items.push({
          reminder,
          scheduledFor: slot,
          displayAt: new Date(until),
          bucket: bucketFor(until, nowMs),
          snoozed: true,
        });
        continue;
      }
      items.push({
        reminder,
        scheduledFor: slot,
        displayAt: slot,
        bucket: bucketFor(ts, nowMs),
        snoozed: false,
      });
    }
  }
  return items.toSorted((a, b) => a.displayAt.getTime() - b.displayAt.getTime());
}

/** Whether a reminder has at least one slot today (for the hero's counters). */
export function isDueToday(reminder: Reminder, now: Date): boolean {
  return planToday([reminder], [], now).length > 0;
}
