import { addEvent, listEventsForReminder, type NewReminderEvent } from "../db/events";
import { dayKeyForDate } from "../stats/dayKey";
import { isMilestone } from "../stats/streakMilestones";
import { currentStreak, successfulDayKeys } from "../stats/streaks";
import type { HabitGoal, Reminder, ReminderEvent } from "../types";

export type HabitLogPlan = {
  events: NewReminderEvent[];
  /** Streak length reached by this log when it is a milestone, else null. */
  milestone: number | null;
  /** Whether this log closed out the day (goal reached for the first time). */
  completesDay: boolean;
};

/** Target for a day, or null for a binary (or goal-less) habit. */
export function habitTarget(goal: HabitGoal | undefined): number | null {
  if (goal?.type === "count") return goal.target;
  if (goal?.type === "duration") return goal.targetMinutes;
  return null;
}

/** Progress summed over the given day, from `progress` events. */
export function progressOnDay(events: readonly ReminderEvent[], day: string): number {
  let sum = 0;
  for (const event of events) {
    if (event.action !== "progress" || event.triggeredAt === undefined) continue;
    if (dayKeyForDate(new Date(event.triggeredAt)) !== day) continue;
    sum += event.progress?.value ?? 0;
  }
  return sum;
}

/**
 * Pure planner for one tap on a habit. Streaks only count `completed` events,
 * so a count/duration habit also gets one when this progress step is the one
 * that reaches the target — otherwise "8 / 8 Glas" never shows up as a done
 * day. A binary habit that is already done today plans nothing.
 */
export function planHabitLog(
  reminder: Pick<Reminder, "id" | "goal">,
  events: readonly ReminderEvent[],
  value: number,
  now: number,
): HabitLogPlan {
  const today = dayKeyForDate(new Date(now));
  const wasDone = successfulDayKeys(events).has(today);
  const target = habitTarget(reminder.goal);
  const planned: NewReminderEvent[] = [];

  if (target === null) {
    if (wasDone) return { events: [], milestone: null, completesDay: false };
    planned.push({ reminderId: reminder.id, action: "completed", triggeredAt: now });
  } else {
    const unit = reminder.goal?.type === "count" ? reminder.goal.unit : "min";
    planned.push({
      reminderId: reminder.id,
      action: "progress",
      triggeredAt: now,
      progress: { value, unit },
    });
    const before = progressOnDay(events, today);
    if (!wasDone && before < target && before + value >= target) {
      planned.push({ reminderId: reminder.id, action: "completed", triggeredAt: now });
    }
  }

  const completesDay = !wasDone && planned.some((e) => e.action === "completed");
  const streak = completesDay ? currentStreak(events, new Date(now)) + 1 : 0;
  return {
    events: planned,
    milestone: completesDay && isMilestone(streak) ? streak : null,
    completesDay,
  };
}

// One queue per habit. Two quick taps used to plan from the same stale event
// list: from 7/8, both "+1" could miss the target-crossing completion, or a
// binary habit got completed twice.
const queues = new Map<string, Promise<unknown>>();

/**
 * Logs one tap. Taps on the same habit run one after another, and each plans
 * from the events freshly read from the DB — not from the caller's
 * possibly-stale snapshot — so the completion decision sees every earlier tap.
 */
export function logHabit(
  reminder: Pick<Reminder, "id" | "goal">,
  value: number,
  now: () => number = Date.now,
): Promise<HabitLogPlan> {
  const previous = queues.get(reminder.id) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(async () => {
      const events = await listEventsForReminder(reminder.id);
      const plan = planHabitLog(reminder, events, value, now());
      for (const event of plan.events) await addEvent(event);
      return plan;
    });
  queues.set(reminder.id, next);
  void next
    .catch(() => {})
    .finally(() => {
      if (queues.get(reminder.id) === next) queues.delete(reminder.id);
    });
  return next;
}
