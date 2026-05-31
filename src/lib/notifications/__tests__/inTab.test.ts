import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Reminder } from "../../types";
import { _peekInTabTimers, armInTabTimers, clearAllInTabTimers, clearInTabTimers } from "../inTab";

const baseReminder: Reminder = {
  id: "r-1",
  kind: "reminder",
  title: "Test",
  icon: "⏰",
  category: "other",
  color: "emerald",
  schedule: { type: "interval", minutes: 60 },
  streakSensitive: false,
  active: true,
  createdAt: 0,
  updatedAt: 0,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-05T10:00:00"));
});

afterEach(() => {
  clearAllInTabTimers();
  vi.useRealTimers();
});

describe("armInTabTimers", () => {
  it("legt für ein 60-min-Interval mehrere Timer in 24h Horizont an", () => {
    const count = armInTabTimers(null, baseReminder, Date.now());
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(8);
    expect(_peekInTabTimers(baseReminder.id)).toBe(count);
  });

  it("ersetzt vorhandene Timer beim erneuten Arm", () => {
    armInTabTimers(null, baseReminder, Date.now());
    const before = _peekInTabTimers(baseReminder.id);
    armInTabTimers(null, baseReminder, Date.now());
    const after = _peekInTabTimers(baseReminder.id);
    expect(after).toBe(before);
  });

  it("liefert 0 für inventory_based", () => {
    const inv: Reminder = {
      ...baseReminder,
      schedule: { type: "inventory_based" },
    };
    const count = armInTabTimers(null, inv, Date.now());
    expect(count).toBe(0);
  });

  it("liefert 0 wenn Reminder inactive", () => {
    const inactive = { ...baseReminder, active: false };
    const count = armInTabTimers(null, inactive, Date.now());
    expect(count).toBe(0);
  });

  it("clearInTabTimers entfernt Timer für reminderId", () => {
    armInTabTimers(null, baseReminder, Date.now());
    clearInTabTimers(baseReminder.id);
    expect(_peekInTabTimers(baseReminder.id)).toBe(0);
  });
});
