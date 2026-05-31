import type { Schedule } from "../types";
import { nextDailyOccurrence } from "./dailyEngine";
import { nextElapsedOccurrence } from "./elapsedEngine";
import { nextExpiresOccurrence } from "./expiresEngine";
import { nextIntervalOccurrence } from "./intervalEngine";
import { nextMonthlyOccurrence } from "./monthlyEngine";
import { nextBiweeklyOccurrence, nextWeeklyOccurrence } from "./weeklyEngine";
import { nextYearlyOccurrence } from "./yearlyEngine";

/**
 * Pure function: returns the next occurrence strictly after `from`,
 * or null when the schedule has no future triggers (e.g. inventory_based,
 * or an `expires` schedule that has already lapsed).
 */
export function nextOccurrence(schedule: Schedule, from: Date): Date | null {
  switch (schedule.type) {
    case "interval":
      return nextIntervalOccurrence(schedule, from);
    case "daily":
      return nextDailyOccurrence(schedule, from);
    case "weekly":
      return nextWeeklyOccurrence(schedule, from);
    case "biweekly":
      return nextBiweeklyOccurrence(schedule, from);
    case "monthly":
      return nextMonthlyOccurrence(schedule, from);
    case "yearly":
      return nextYearlyOccurrence(schedule, from);
    case "elapsed":
      return nextElapsedOccurrence(schedule, from);
    case "expires":
      return nextExpiresOccurrence(schedule, from);
    case "inventory_based":
      return null;
  }
}

/**
 * Returns up to `n` future occurrences. Used for re-arming Notification
 * Triggers and rendering the Today-Timeline / 7-day overview.
 */
export function nextNOccurrences(schedule: Schedule, from: Date, n: number): Date[] {
  if (n <= 0) return [];
  const result: Date[] = [];
  let cursor = from;
  for (let i = 0; i < n; i++) {
    const next = nextOccurrence(schedule, cursor);
    if (!next) break;
    result.push(next);
    cursor = next;
  }
  return result;
}
