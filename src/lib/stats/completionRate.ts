import type { ReminderEvent } from "../types";
import { dayKeyForDate, lastNDayKeys } from "./dayKey";

export interface CompletionRate {
  windowDays: number;
  successfulDays: number;
  rate: number; // 0..1
}

export function completionRateForWindow(
  events: readonly ReminderEvent[],
  windowDays: number,
  today: Date = new Date(),
): CompletionRate {
  const window = new Set(lastNDayKeys(windowDays, today));
  const successful = new Set<string>();
  for (const event of events) {
    if (event.action !== "completed") continue;
    const ts = event.triggeredAt ?? event.scheduledFor;
    if (ts == null) continue;
    const key = dayKeyForDate(new Date(ts));
    if (window.has(key)) successful.add(key);
  }
  return {
    windowDays,
    successfulDays: successful.size,
    rate: successful.size / windowDays,
  };
}

export interface CompletionSummary {
  last7: CompletionRate;
  last30: CompletionRate;
  last365: CompletionRate;
}

export function completionSummary(
  events: readonly ReminderEvent[],
  today: Date = new Date(),
): CompletionSummary {
  return {
    last7: completionRateForWindow(events, 7, today),
    last30: completionRateForWindow(events, 30, today),
    last365: completionRateForWindow(events, 365, today),
  };
}

/**
 * Average days between consecutive `completed` events. Useful for `elapsed`
 * reminders to surface a "you usually water this every X days" insight.
 * Returns null if fewer than two completions.
 */
export function averageDaysBetweenCompletions(events: readonly ReminderEvent[]): number | null {
  const stamps = events
    .filter((e) => e.action === "completed")
    .map((e) => e.triggeredAt ?? e.scheduledFor)
    .filter((ts): ts is number => ts != null)
    .sort((a, b) => a - b);
  if (stamps.length < 2) return null;
  let sumGapMs = 0;
  for (let i = 1; i < stamps.length; i++) {
    sumGapMs += stamps[i] - stamps[i - 1];
  }
  const avgMs = sumGapMs / (stamps.length - 1);
  return avgMs / (24 * 60 * 60 * 1000);
}

export function completedCount(events: readonly ReminderEvent[]): number {
  return events.filter((e) => e.action === "completed").length;
}
