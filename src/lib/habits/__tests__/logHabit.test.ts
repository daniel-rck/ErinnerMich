import { describe, expect, it } from "vitest";
import { successfulDayKeys } from "../../stats/streaks";
import type { ReminderEvent } from "../../types";
import { planHabitLog } from "../logHabit";

const now = new Date(2026, 8, 22, 12, 0).getTime();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

function ev(partial: Partial<ReminderEvent>): ReminderEvent {
  return { id: String(Math.random()), reminderId: "h", action: "completed", ...partial };
}

describe("planHabitLog", () => {
  const water = { id: "h", goal: { type: "count" as const, target: 8, unit: "Glas" } };

  it("adds a completed event when a count step reaches the target", () => {
    const events = [
      ev({ action: "progress", triggeredAt: now - hour, progress: { value: 7, unit: "Glas" } }),
    ];
    const plan = planHabitLog(water, events, 1, now);
    expect(plan.events.map((e) => e.action)).toEqual(["progress", "completed"]);
    expect(plan.completesDay).toBe(true);
  });

  it("only logs progress below the target and after the day is done", () => {
    expect(planHabitLog(water, [], 1, now).events.map((e) => e.action)).toEqual(["progress"]);
    const done = [
      ev({ action: "progress", triggeredAt: now - hour, progress: { value: 8, unit: "Glas" } }),
      ev({ action: "completed", triggeredAt: now - hour }),
    ];
    expect(planHabitLog(water, done, 1, now).events.map((e) => e.action)).toEqual(["progress"]);
  });

  it("ignores progress from other days", () => {
    const events = [
      ev({ action: "progress", triggeredAt: now - day, progress: { value: 7, unit: "Glas" } }),
    ];
    expect(planHabitLog(water, events, 1, now).completesDay).toBe(false);
  });

  it("treats a goal-less habit as binary and doesn't double-complete", () => {
    const first = planHabitLog({ id: "h", goal: undefined }, [], 1, now);
    expect(first.events.map((e) => e.action)).toEqual(["completed"]);
    const again = planHabitLog(
      { id: "h", goal: undefined },
      [ev({ triggeredAt: now - hour })],
      1,
      now,
    );
    expect(again.events).toEqual([]);
  });

  it("makes a reached count goal count towards the streak", () => {
    const events = [
      ev({ action: "progress", triggeredAt: now - hour, progress: { value: 7, unit: "Glas" } }),
    ];
    const plan = planHabitLog(water, events, 1, now);
    const after = [...events, ...plan.events.map((e) => ({ ...e, id: "x" }))];
    expect(successfulDayKeys(after).size).toBe(1);
  });

  it("reports the 7-day milestone on the seventh day in a row", () => {
    const binary = { id: "h", goal: { type: "binary" as const } };
    const sixDays = [1, 2, 3, 4, 5, 6].map((d) => ev({ triggeredAt: now - d * day }));
    expect(planHabitLog(binary, sixDays, 1, now).milestone).toBe(7);
    expect(planHabitLog(binary, sixDays.slice(1), 1, now).milestone).toBeNull();
  });
});
