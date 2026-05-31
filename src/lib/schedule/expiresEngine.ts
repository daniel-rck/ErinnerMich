import type { PreWarning, Schedule } from "../types";

type ExpiresSchedule = Extract<Schedule, { type: "expires" }>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the next reminder timestamp for an `expires` schedule.
 *
 * The schedule fires at each PreWarning offset before `expiresAt`, plus
 * once at `expiresAt` itself. We pick the earliest such trigger > from.
 * Returns null once `expiresAt` is in the past.
 */
export function nextExpiresOccurrence(schedule: ExpiresSchedule, from: Date): Date | null {
  if (from.getTime() >= schedule.expiresAt) return null;

  const triggers = buildTriggers(schedule.expiresAt, schedule.preWarnings);
  for (const ts of triggers) {
    if (ts > from.getTime()) return new Date(ts);
  }
  return null;
}

/**
 * Returns *all* upcoming triggers (PreWarnings + expiresAt) after `from`,
 * useful for re-arming notifications and rendering countdown cards.
 */
export function listExpiresTriggers(schedule: ExpiresSchedule, from: Date): Date[] {
  if (from.getTime() >= schedule.expiresAt) return [];
  return buildTriggers(schedule.expiresAt, schedule.preWarnings)
    .filter((ts) => ts > from.getTime())
    .map((ts) => new Date(ts));
}

function buildTriggers(expiresAt: number, preWarnings: PreWarning[]): number[] {
  const expiry = new Date(expiresAt);
  const set = new Set<number>([expiresAt]);

  for (const warning of preWarnings) {
    const trigger = new Date(expiry);
    if (warning.kind === "days") {
      trigger.setDate(trigger.getDate() - warning.value);
    } else if (warning.kind === "months") {
      trigger.setMonth(trigger.getMonth() - warning.value);
    } else {
      trigger.setFullYear(trigger.getFullYear() - warning.value);
    }
    set.add(trigger.getTime());
  }
  return [...set].sort((a, b) => a - b);
}

export function daysUntilExpiry(schedule: ExpiresSchedule, from: Date): number {
  return Math.ceil((schedule.expiresAt - from.getTime()) / DAY_MS);
}
