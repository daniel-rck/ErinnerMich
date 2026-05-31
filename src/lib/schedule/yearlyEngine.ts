import type { Schedule } from "../types";
import { clampDayInMonth, parseHM } from "./helpers";

type YearlySchedule = Extract<Schedule, { type: "yearly" }>;

/**
 * Returns the next yearly occurrence strictly after `from`.
 *
 * `leadDays` (z. B. Geburtstags-Vorwarnung) verschiebt die Notification
 * `leadDays` Tage vor das eigentliche Datum. Die Funktion gibt also den
 * Notification-Zeitpunkt zurück, nicht das Ereignis selbst. Bei `leadDays = 3`
 * für ein Geburtstagsdatum am 15.01. liefert sie den 12.01. um `time`.
 */
export function nextYearlyOccurrence(schedule: YearlySchedule, from: Date): Date {
  if (schedule.month < 1 || schedule.month > 12) {
    throw new Error("yearly.month muss 1..12 sein");
  }
  if (schedule.day < 1 || schedule.day > 31) {
    throw new Error("yearly.day muss 1..31 sein");
  }
  const { h, m } = parseHM(schedule.time);
  const monthIndex = schedule.month - 1;
  const lead = schedule.leadDays ?? 0;
  if (lead < 0) throw new Error("yearly.leadDays darf nicht negativ sein");

  for (let offset = 0; offset < 3; offset++) {
    const year = from.getFullYear() + offset;
    const day = clampDayInMonth(year, monthIndex, schedule.day);
    const baseEvent = new Date(year, monthIndex, day, h, m, 0, 0);
    const notifyAt = new Date(baseEvent);
    notifyAt.setDate(notifyAt.getDate() - lead);
    if (notifyAt.getTime() > from.getTime()) {
      return notifyAt;
    }
  }
  throw new Error("Kein passendes Jahr gefunden");
}
