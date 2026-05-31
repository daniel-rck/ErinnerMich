import type { Schedule } from "../types";
import { addMinutes, parseHM, startOfDay, withTime } from "./helpers";

type IntervalSchedule = Extract<Schedule, { type: "interval" }>;

/**
 * Returns the next occurrence strictly after `from`.
 *
 * If activeWindow is set, occurrences are clamped into the window:
 * - First slot of a day is at activeWindow.start.
 * - Subsequent slots are spaced by `minutes`.
 * - If `from + minutes` falls past activeWindow.end, jump to next day's window start.
 *
 * Active windows that wrap around midnight (e.g. 22:00–06:00) are not supported
 * and will throw to surface validation errors at the form layer.
 */
export function nextIntervalOccurrence(schedule: IntervalSchedule, from: Date): Date {
  if (schedule.minutes <= 0) {
    throw new Error("interval.minutes muss > 0 sein");
  }

  if (!schedule.activeWindow) {
    return addMinutes(from, schedule.minutes);
  }

  const start = parseHM(schedule.activeWindow.start);
  const end = parseHM(schedule.activeWindow.end);
  const startMinutes = start.h * 60 + start.m;
  const endMinutes = end.h * 60 + end.m;

  if (endMinutes <= startMinutes) {
    throw new Error("interval.activeWindow darf Mitternacht nicht überspannen (start < end)");
  }

  const today = startOfDay(from);
  const windowStart = withTime(today, schedule.activeWindow.start);
  const windowEnd = withTime(today, schedule.activeWindow.end);

  if (from.getTime() < windowStart.getTime()) {
    return windowStart;
  }

  const next = addMinutes(from, schedule.minutes);
  if (next.getTime() <= windowEnd.getTime()) {
    return next;
  }

  const nextDayWindowStart = withTime(addMinutes(today, 24 * 60), schedule.activeWindow.start);
  return nextDayWindowStart;
}
