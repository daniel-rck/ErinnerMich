import { describe, expect, it } from "vitest";
import { addEvent } from "../events";
import { setInventory } from "../inventories";
import {
  createReminder,
  deleteReminder,
  getReminder,
  listReminders,
  type NewReminder,
  updateReminder,
} from "../reminders";

const baseReminder: NewReminder = {
  kind: "reminder",
  title: "Pflanze gießen",
  category: "plant",
  icon: "🪴",
  color: "green",
  schedule: { type: "elapsed", days: 5 },
  streakSensitive: false,
  active: true,
};

describe("reminders CRUD", () => {
  it("legt einen Reminder mit ID und Timestamps an", async () => {
    const r = await createReminder(baseReminder);
    expect(r.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(r.createdAt).toBeGreaterThan(0);
    expect(r.updatedAt).toBe(r.createdAt);
  });

  it("liest einen Reminder per id zurück", async () => {
    const r = await createReminder(baseReminder);
    const fetched = await getReminder(r.id);
    expect(fetched).toEqual(r);
  });

  it("updated einen Reminder und passt updatedAt an", async () => {
    const r = await createReminder(baseReminder);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await updateReminder(r.id, { title: "Neu" });
    expect(updated.title).toBe("Neu");
    expect(updated.updatedAt).toBeGreaterThan(r.updatedAt);
    expect(updated.createdAt).toBe(r.createdAt);
  });

  it("listet Reminder nach kind gefiltert", async () => {
    await createReminder(baseReminder);
    await createReminder({
      ...baseReminder,
      kind: "habit",
      title: "Wasser",
      goal: { type: "count", target: 8, unit: "Glas" },
    });
    await createReminder({
      ...baseReminder,
      kind: "mood",
      title: "Mood",
      moodConfig: { scale: "five-emoji", tags: [] },
    });

    expect((await listReminders({ kind: "habit" })).length).toBe(1);
    expect((await listReminders({ kind: "mood" })).length).toBe(1);
    expect((await listReminders()).length).toBe(3);
  });

  it("filtert auf activeOnly", async () => {
    await createReminder({ ...baseReminder, active: true });
    await createReminder({ ...baseReminder, active: false });
    expect((await listReminders({ activeOnly: true })).length).toBe(1);
    expect((await listReminders()).length).toBe(2);
  });

  it("löscht einen Reminder mitsamt Events und Inventory", async () => {
    const r = await createReminder({
      ...baseReminder,
      kind: "habit",
      goal: { type: "binary" },
    });
    await addEvent({
      reminderId: r.id,
      action: "completed",
      triggeredAt: Date.now(),
    });
    await setInventory({
      reminderId: r.id,
      remaining: 10,
      unit: "Stk",
      refillThreshold: 2,
    });

    await deleteReminder(r.id);

    expect(await getReminder(r.id)).toBeUndefined();
  });
});
