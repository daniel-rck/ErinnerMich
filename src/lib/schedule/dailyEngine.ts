import type { Schedule } from "../types";
import { addDays, parseHM, withTime } from "./helpers";

type DailySchedule = Extract<Schedule, { type: "daily" }>;

export function nextDailyOccurrence(schedule: DailySchedule, from: Date): Date {
  if (schedule.times.length === 0) {
    throw new Error("daily.times darf nicht leer sein");
  }
  const sorted = [...schedule.times].sort(byTime);
  for (const time of sorted) {
    const candidate = withTime(from, time);
    if (candidate.getTime() > from.getTime()) {
      return candidate;
    }
  }
  return withTime(addDays(from, 1), sorted[0]);
}

function byTime(a: string, b: string): number {
  const ha = parseHM(a);
  const hb = parseHM(b);
  return ha.h * 60 + ha.m - (hb.h * 60 + hb.m);
}
