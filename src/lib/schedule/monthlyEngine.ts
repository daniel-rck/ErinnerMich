import type { Schedule } from "../types";
import { clampDayInMonth, parseHM } from "./helpers";

type MonthlySchedule = Extract<Schedule, { type: "monthly" }>;

export function nextMonthlyOccurrence(schedule: MonthlySchedule, from: Date): Date {
  if (schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31) {
    throw new Error("monthly.dayOfMonth muss 1..31 sein");
  }
  const { h, m } = parseHM(schedule.time);
  for (let offset = 0; offset < 13; offset++) {
    const year = from.getFullYear();
    const monthIndex = from.getMonth() + offset;
    const day = clampDayInMonth(year, monthIndex, schedule.dayOfMonth);
    const candidate = new Date(year, monthIndex, day, h, m, 0, 0);
    if (candidate.getTime() > from.getTime()) {
      return candidate;
    }
  }
  throw new Error("Kein passender Monat innerhalb eines Jahres gefunden");
}
