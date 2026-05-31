import { afterEach, describe, expect, it } from "vitest";
import { _resetSchedulerForTests, schedulerStatus } from "../scheduler";

afterEach(() => {
  _resetSchedulerForTests();
  delete (globalThis as { Notification?: unknown }).Notification;
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
