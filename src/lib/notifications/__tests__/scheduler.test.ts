import { afterEach, describe, expect, it, vi } from "vitest";
import { addEvent } from "../../db/events";
import { createReminder } from "../../db/reminders";
import { _peekInTabTimers } from "../inTab";
import { _resetSchedulerForTests, rearmAll, schedulerStatus, startScheduler } from "../scheduler";

afterEach(() => {
  _resetSchedulerForTests();
  delete (globalThis as { Notification?: unknown }).Notification;
  vi.useRealTimers();
});

describe("schedulerStatus", () => {
  it("liefert unsupported ohne Notification-API", () => {
    delete (globalThis as { Notification?: unknown }).Notification;
    expect(schedulerStatus()).toEqual({
      mode: "unsupported",
      hasPermission: false,
    });
  });

  it("liefert in-tab als Default, wenn nur Notification, aber kein TimestampTrigger", () => {
    (globalThis as { Notification?: unknown }).Notification = {
      permission: "granted",
    };
    const status = schedulerStatus();
    expect(status.mode).toBe("in-tab");
    expect(status.hasPermission).toBe(true);
  });

  it("liefert hasPermission=false bei permission=default", () => {
    (globalThis as { Notification?: unknown }).Notification = {
      permission: "default",
    };
    expect(schedulerStatus().hasPermission).toBe(false);
  });
});

describe("startScheduler", () => {
  it("re-armiert in-tab Timer periodisch, sobald Occurrences in den 24h-Horizont rücken", async () => {
    (globalThis as { Notification?: unknown }).Notification = {
      permission: "granted",
    };
    const fakeNow = new Date("2026-05-05T10:00:00").getTime();

    // Nächste Occurrence in 48 h — beim Start außerhalb des 24h-Horizonts.
    // Anlage mit echten Timern, damit fake-indexeddb nicht blockiert.
    const reminder = await createReminder({
      kind: "reminder",
      title: "Elapsed",
      icon: "⏰",
      category: "other",
      color: "emerald",
      schedule: { type: "elapsed", days: 2, lastDone: fakeNow },
      streakSensitive: false,
      active: true,
    });

    vi.useFakeTimers();
    vi.setSystemTime(fakeNow);
    startScheduler();
    await vi.advanceTimersByTimeAsync(0);
    expect(_peekInTabTimers(reminder.id)).toBe(0);

    // Nach 25 h liegt die Occurrence ~23 h voraus → das stündliche
    // Re-Arm-Interval muss sie armiert haben.
    await vi.advanceTimersByTimeAsync(25 * 60 * 60 * 1000);
    expect(_peekInTabTimers(reminder.id)).toBeGreaterThan(0);
  });
});

describe("rearmAll", () => {
  it("arms the remaining reminders when one has a schedule the engines reject", async () => {
    (globalThis as { Notification?: unknown }).Notification = { permission: "granted" };
    const base = {
      kind: "reminder" as const,
      icon: "⏰",
      category: "other" as const,
      color: "emerald",
      streakSensitive: false,
      active: true,
    };
    await createReminder({ ...base, title: "Kaputt", schedule: { type: "daily", times: [] } });
    const ok = await createReminder({
      ...base,
      title: "Ok",
      schedule: { type: "interval", minutes: 30 },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await rearmAll();
    expect(_peekInTabTimers(ok.id)).toBeGreaterThan(0);
    errorSpy.mockRestore();
  });
});

describe("snooze re-arming", () => {
  it("arms an in-tab timer at snoozeUntil once a snoozed event lands", async () => {
    (globalThis as { Notification?: unknown }).Notification = { permission: "granted" };
    // Next regular occurrence is days away, so any armed timer is the snooze.
    const reminder = await createReminder({
      kind: "reminder",
      title: "Später",
      icon: "⏰",
      category: "other",
      color: "emerald",
      schedule: { type: "elapsed", days: 5, lastDone: Date.now() },
      streakSensitive: false,
      active: true,
    });
    startScheduler();
    await vi.waitFor(() => expect(_peekInTabTimers(reminder.id)).toBe(0));

    await addEvent({
      reminderId: reminder.id,
      action: "snoozed",
      triggeredAt: Date.now(),
      snoozeUntil: Date.now() + 30 * 60_000,
    });
    await vi.waitFor(() => expect(_peekInTabTimers(reminder.id)).toBe(1));
  });
});
