import type { HabitGoal, Schedule } from "../types";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * A German, user-facing reason why `schedule` can never fire, or null when it
 * is fine. The form used to save `times: []`, no weekday, or a cleared time
 * input — schedules that either never notify or make the engines throw.
 */
export function scheduleProblem(schedule: Schedule): string | null {
  switch (schedule.type) {
    case "daily":
      if (schedule.times.length === 0) return "Mindestens eine Uhrzeit angeben.";
      if (schedule.times.some((t) => !HHMM.test(t))) return "Jede Uhrzeit braucht einen Wert.";
      return null;
    case "weekly":
    case "biweekly":
      if (schedule.days.length === 0) return "Mindestens einen Wochentag wählen.";
      return HHMM.test(schedule.time) ? null : "Bitte eine Uhrzeit angeben.";
    case "monthly":
    case "yearly":
      return HHMM.test(schedule.time) ? null : "Bitte eine Uhrzeit angeben.";
    case "elapsed":
      return Number.isInteger(schedule.days) && schedule.days >= 1
        ? null
        : "Die Anzahl Tage muss mindestens 1 sein.";
    case "interval":
      return Number.isInteger(schedule.minutes) && schedule.minutes >= 1
        ? null
        : "Das Intervall muss mindestens 1 Minute sein.";
    case "expires":
    case "inventory_based":
      return null;
  }
}

export function goalProblem(goal: HabitGoal | undefined): string | null {
  if (goal?.type === "count") {
    if (!Number.isFinite(goal.target) || goal.target < 1) return "Das Ziel muss mindestens 1 sein.";
    if (goal.unit.trim() === "") return "Bitte eine Einheit angeben.";
  }
  if (
    goal?.type === "duration" &&
    (!Number.isFinite(goal.targetMinutes) || goal.targetMinutes < 1)
  ) {
    return "Die Dauer muss mindestens 1 Minute sein.";
  }
  return null;
}
