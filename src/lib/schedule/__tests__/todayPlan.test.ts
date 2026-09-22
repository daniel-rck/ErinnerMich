import { describe, expect, it } from "vitest";
import type { Reminder, ReminderEvent } from "../../types";
import { planToday } from "../todayPlan";

const base: Reminder = {
  id: "r",
  kind: "reminder",
  title: "Tabletten",
  icon: "💊",
  category: "health",
  color: "emerald",
  schedule: { type: "daily", times: ["08:00", "20:00"] },
  streakSensitive: false,
  active: true,
  createdAt: 0,
  updatedAt: 0,
};

const at = (h: number, m = 0) => new Date(2026, 8, 22, h, m);

function ev(partial: Partial<ReminderEvent>): ReminderEvent {
  return { id: String(Math.random()), reminderId: "r", action: "completed", ...partial };
}

describe("planToday", () => {
  it("lists every slot of a multi-time daily reminder", () => {
    const items = planToday([base], [], at(12));
    expect(items.map((i) => [i.scheduledFor.getHours(), i.bucket])).toEqual([
      [8, "overdue"],
      [20, "later"],
    ]);
  });

  it("completing the 08:00 slot leaves the 20:00 slot open", () => {
    const events = [ev({ triggeredAt: at(8, 5).getTime(), scheduledFor: at(8).getTime() })];
    const items = planToday([base], events, at(12));
    expect(items.map((i) => [i.scheduledFor.getHours(), i.bucket])).toEqual([
      [8, "done"],
      [20, "later"],
    ]);
  });

  it("assigns a legacy completion without scheduledFor to the earliest open slot", () => {
    const events = [ev({ triggeredAt: at(9).getTime() })];
    expect(planToday([base], events, at(12)).map((i) => i.bucket)).toEqual(["done", "later"]);
  });

  it("moves a due, snoozed slot to the snooze end", () => {
    const events = [
      ev({
        action: "snoozed",
        triggeredAt: at(11, 50).getTime(),
        scheduledFor: at(8).getTime(),
        snoozeUntil: at(13).getTime(),
      }),
    ];
    const items = planToday([base], events, at(12));
    expect(
      items.map((i) => [i.scheduledFor.getHours(), i.displayAt.getHours(), i.bucket, i.snoozed]),
    ).toEqual([
      [8, 13, "later", true],
      [20, 20, "later", false],
    ]);
  });

  it("moves only the snoozed slot, even when the snooze runs past another one", () => {
    const events = [
      ev({
        action: "snoozed",
        triggeredAt: at(19, 50).getTime(),
        scheduledFor: at(8).getTime(),
        snoozeUntil: at(21).getTime(),
      }),
    ];
    const items = planToday([base], events, at(20, 10));
    expect(
      items.map((i) => [i.scheduledFor.getHours(), i.displayAt.getHours(), i.snoozed]),
    ).toEqual([
      [20, 20, false],
      [8, 21, true],
    ]);
  });

  it("picks the latest due slot of a short interval, not one of the first twelve", () => {
    const every30: Reminder = { ...base, schedule: { type: "interval", minutes: 30 } };
    const [item] = planToday([every30], [], at(12, 10));
    expect([item?.scheduledFor.getHours(), item?.scheduledFor.getMinutes()]).toEqual([12, 0]);
  });

  it("shows an interval reminder as a single card", () => {
    const water: Reminder = {
      ...base,
      schedule: { type: "interval", minutes: 90, activeWindow: { start: "08:00", end: "21:00" } },
    };
    const items = planToday([water], [], at(12));
    expect(items).toHaveLength(1);
    expect(items[0]?.scheduledFor.getHours()).toBe(11);
  });

  it("skips inactive and archived reminders", () => {
    expect(planToday([{ ...base, active: false }], [], at(12))).toEqual([]);
    expect(planToday([{ ...base, archivedAt: 1 }], [], at(12))).toEqual([]);
  });
});
