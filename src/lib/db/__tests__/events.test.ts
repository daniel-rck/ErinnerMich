import { describe, expect, it } from "vitest";
import { dayKey } from "..";
import {
  addEvent,
  dailyProgress,
  deleteEvent,
  listEventsForDay,
  listEventsForReminder,
} from "../events";
import { createReminder, type NewReminder } from "../reminders";

const habit: NewReminder = {
  kind: "habit",
  title: "Wasser",
  category: "health",
  icon: "💧",
  color: "blue",
  schedule: { type: "daily", times: ["09:00"] },
  goal: { type: "count", target: 8, unit: "Glas" },
  streakSensitive: true,
  active: true,
};

describe("events CRUD + Aggregation", () => {
  it("hängt ein Event an und liest es per reminderId", async () => {
    const r = await createReminder(habit);
    await addEvent({
      reminderId: r.id,
      action: "completed",
      triggeredAt: Date.now(),
    });
    const list = await listEventsForReminder(r.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.action).toBe("completed");
  });

  it("listet Events sortiert (neueste zuerst)", async () => {
    const r = await createReminder(habit);
    const t = new Date("2026-05-04T12:00:00Z").getTime();
    await addEvent({ reminderId: r.id, action: "completed", triggeredAt: t });
    await addEvent({
      reminderId: r.id,
      action: "completed",
      triggeredAt: t + 1000,
    });
    const list = await listEventsForReminder(r.id);
    expect(list[0]!.triggeredAt).toBe(t + 1000);
    expect(list[1]!.triggeredAt).toBe(t);
  });

  it("aggregiert Tagesprogress über action=progress", async () => {
    const r = await createReminder(habit);
    const t = new Date("2026-05-04T09:00:00Z").getTime();
    await addEvent({
      reminderId: r.id,
      action: "progress",
      triggeredAt: t,
      progress: { value: 1, unit: "Glas" },
    });
    await addEvent({
      reminderId: r.id,
      action: "progress",
      triggeredAt: t + 3600_000,
      progress: { value: 2, unit: "Glas" },
    });
    await addEvent({
      reminderId: r.id,
      action: "progress",
      triggeredAt: t + 7200_000,
      progress: { value: 1, unit: "Glas" },
    });

    const result = await dailyProgress(r.id, t);
    expect(result.sum).toBe(4);
    expect(result.events).toHaveLength(3);
  });

  it("zählt completions getrennt von progress", async () => {
    const r = await createReminder(habit);
    const t = new Date("2026-05-04T09:00:00Z").getTime();
    await addEvent({ reminderId: r.id, action: "completed", triggeredAt: t });
    await addEvent({
      reminderId: r.id,
      action: "progress",
      triggeredAt: t,
      progress: { value: 5, unit: "Glas" },
    });

    const result = await dailyProgress(r.id, dayKey(t));
    expect(result.completions).toBe(1);
    expect(result.sum).toBe(5);
  });

  it("listet Events pro Tag", async () => {
    const r = await createReminder(habit);
    const day1 = new Date("2026-05-03T09:00:00Z").getTime();
    const day2 = new Date("2026-05-04T09:00:00Z").getTime();
    await addEvent({ reminderId: r.id, action: "completed", triggeredAt: day1 });
    await addEvent({ reminderId: r.id, action: "completed", triggeredAt: day2 });

    const eventsForDay2 = await listEventsForDay(dayKey(day2));
    expect(eventsForDay2).toHaveLength(1);
    expect(eventsForDay2[0]!.triggeredAt).toBe(day2);
  });

  it("löscht ein Event", async () => {
    const r = await createReminder(habit);
    const e = await addEvent({
      reminderId: r.id,
      action: "completed",
      triggeredAt: Date.now(),
    });
    await deleteEvent(e.id);
    expect(await listEventsForReminder(r.id)).toHaveLength(0);
  });
});
