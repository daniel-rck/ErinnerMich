import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureNotificationPermission, getNotificationSupport } from "../permission";

interface NotificationStub {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
}

function setNotification(stub: NotificationStub | undefined): void {
  if (stub === undefined) {
    delete (globalThis as { Notification?: unknown }).Notification;
  } else {
    (globalThis as { Notification?: unknown }).Notification = stub;
  }
}

afterEach(() => {
  setNotification(undefined);
  vi.restoreAllMocks();
});

describe("getNotificationSupport", () => {
  it("liefert unsupported, wenn Notification fehlt", () => {
    expect(getNotificationSupport().state).toBe("unsupported");
  });

  it("liefert supported + permission, wenn vorhanden", () => {
    setNotification({
      permission: "default",
      requestPermission: vi.fn(),
    });
    const support = getNotificationSupport();
    expect(support).toEqual({ state: "supported", permission: "default" });
  });
});

describe("ensureNotificationPermission", () => {
  it("returnt unsupported, wenn Notification fehlt", async () => {
    const result = await ensureNotificationPermission();
    expect(result).toBe("unsupported");
  });

  it("fordert nichts an, wenn bereits granted", async () => {
    const requestPermission = vi.fn();
    setNotification({
      permission: "granted",
      requestPermission,
    });
    const result = await ensureNotificationPermission();
    expect(result).toBe("granted");
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("fordert Berechtigung an, wenn default", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    setNotification({
      permission: "default",
      requestPermission,
    });
    const result = await ensureNotificationPermission();
    expect(result).toBe("granted");
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  it("reagiert robust auf abgelehnten requestPermission-Call", async () => {
    setNotification({
      permission: "denied",
      requestPermission: vi.fn().mockRejectedValue(new Error("nope")),
    });
    const result = await ensureNotificationPermission();
    expect(result).toBe("denied");
  });
});
