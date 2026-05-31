import { describe, expect, it } from "vitest";
import { listEventsForReminder } from "../../db/events";
import { getInventory, setInventory } from "../../db/inventories";
import { listMoodEntriesInRange } from "../../db/moodEntries";
import type { NewReminder } from "../../db/reminders";
import { createReminder } from "../../db/reminders";
import {
  applyNotificationAction,
  consumeUrlNotifAction,
  isNotificationActionMessage,
} from "../clientHandler";

function makeReminder(overrides: Partial<NewReminder> = {}): NewReminder {
  return {
    kind: "reminder",
    title: "Test",
    icon: "⏰",
    category: "other",
    color: "emerald",
    schedule: { type: "daily", times: ["09:00"] },
    streakSensitive: false,
    active: true,
    ...overrides,
  };
}

describe("isNotificationActionMessage", () => {
  it("erkennt eine valide Notification-Message", () => {
    expect(
      isNotificationActionMessage({
        type: "erinnermich:notification-action",
        action: "done",
        reminderId: "abc",
        kind: "reminder",
        scheduledFor: 0,
      }),
    ).toBe(true);
  });

  it("lehnt fremde Messages ab", () => {
    expect(isNotificationActionMessage({ type: "something-else" })).toBe(false);
    expect(isNotificationActionMessage(null)).toBe(false);
    expect(
      isNotificationActionMessage({
        type: "erinnermich:notification-action",
        action: "done",
        reminderId: "abc",
        kind: "invalid",
        scheduledFor: 0,
      }),
    ).toBe(false);
  });
});

describe("applyNotificationAction", () => {
  it('"done" schreibt ein completed-Event', async () => {
    const r = await createReminder(makeReminder());
    await applyNotificationAction({
      action: "done",
      reminderId: r.id,
      kind: "reminder",
      scheduledFor: 0,
    });
    const events = await listEventsForReminder(r.id);
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("completed");
  });

  it('"done" auf elapsed-Reminder updated lastDone', async () => {
    const r = await createReminder(makeReminder({ schedule: { type: "elapsed", days: 5 } }));
    await applyNotificationAction({
      action: "done",
      reminderId: r.id,
      kind: "reminder",
      scheduledFor: 0,
    });
    const inv = await getInventory(r.id);
    // no inventory exists, should be undefined
    expect(inv).toBeUndefined();
  });

  it('"+1" für Habits schreibt progress-Event', async () => {
    const r = await createReminder(
      makeReminder({
        kind: "habit",
        goal: { type: "count", target: 8, unit: "Glas" },
      }),
    );
    await applyNotificationAction({
      action: "+1",
      reminderId: r.id,
      kind: "habit",
      scheduledFor: 1000,
    });
    const events = await listEventsForReminder(r.id);
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("progress");
    expect(events[0].progress).toEqual({ value: 1, unit: "Glas" });
  });

  it('"snooze-30" schreibt snoozed-Event mit snoozeUntil', async () => {
    const r = await createReminder(makeReminder());
    const before = Date.now();
    await applyNotificationAction({
      action: "snooze-30",
      reminderId: r.id,
      kind: "reminder",
      scheduledFor: 0,
    });
    const events = await listEventsForReminder(r.id);
    expect(events[0].action).toBe("snoozed");
    expect(events[0].snoozeUntil).toBeGreaterThanOrEqual(before + 30 * 60_000);
  });

  it('"mood-4" schreibt einen MoodEntry', async () => {
    const r = await createReminder(
      makeReminder({
        kind: "mood",
        moodConfig: { scale: "five-emoji", tags: [] },
      }),
    );
    await applyNotificationAction({
      action: "mood-4",
      reminderId: r.id,
      kind: "mood",
      scheduledFor: 0,
    });
    const entries = await listMoodEntriesInRange(0, Date.now() + 1);
    expect(entries).toHaveLength(1);
    expect(entries[0].mood).toBe(4);
    expect(entries[0].reminderId).toBe(r.id);
  });

  it('"done" dekrementiert Inventory wenn vorhanden', async () => {
    const r = await createReminder(makeReminder());
    await setInventory({
      reminderId: r.id,
      remaining: 10,
      unit: "Tabletten",
      refillThreshold: 2,
    });
    await applyNotificationAction({
      action: "done",
      reminderId: r.id,
      kind: "reminder",
      scheduledFor: 0,
    });
    const inv = await getInventory(r.id);
    expect(inv?.remaining).toBe(9);
  });

  it("macht nichts bei unbekanntem Reminder", async () => {
    await applyNotificationAction({
      action: "done",
      reminderId: "does-not-exist",
      kind: "reminder",
      scheduledFor: 0,
    });
  });
});

describe("consumeUrlNotifAction", () => {
  it("parsed eine kodierte notif-Query", () => {
    const payload = consumeUrlNotifAction(
      "https://app.test/?notif=" + encodeURIComponent("done|abc|1700000000000|reminder"),
    );
    expect(payload).toEqual({
      action: "done",
      reminderId: "abc",
      scheduledFor: 1700000000000,
      kind: "reminder",
    });
  });

  it("returnt null ohne notif-Query", () => {
    expect(consumeUrlNotifAction("https://app.test/")).toBeNull();
  });

  it("lehnt invalide kind-Werte ab", () => {
    expect(
      consumeUrlNotifAction(
        "https://app.test/?notif=" + encodeURIComponent("done|abc|1|something"),
      ),
    ).toBeNull();
  });
});
