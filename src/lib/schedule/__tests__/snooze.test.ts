import { describe, expect, it } from "vitest";
import type { ReminderEvent } from "../../types";
import { pendingSnoozeUntil } from "../snooze";

function event(partial: Partial<ReminderEvent>): ReminderEvent {
  return { id: String(Math.random()), reminderId: "r", action: "completed", ...partial };
}

describe("pendingSnoozeUntil", () => {
  const now = 1_000_000;

  it("returns snoozeUntil when the newest settling event is an active snooze", () => {
    const events = [
      event({ action: "completed", triggeredAt: now - 5000 }),
      event({ action: "snoozed", triggeredAt: now - 1000, snoozeUntil: now + 60_000 }),
      event({ action: "progress", triggeredAt: now }),
    ];
    expect(pendingSnoozeUntil(events, now)).toBe(now + 60_000);
  });

  it("returns null once a completion follows the snooze", () => {
    const events = [
      event({ action: "snoozed", triggeredAt: now - 1000, snoozeUntil: now + 60_000 }),
      event({ action: "completed", triggeredAt: now - 500 }),
    ];
    expect(pendingSnoozeUntil(events, now)).toBeNull();
  });

  it("returns null when the snooze already ran out", () => {
    const events = [event({ action: "snoozed", triggeredAt: now - 9000, snoozeUntil: now - 1 })];
    expect(pendingSnoozeUntil(events, now)).toBeNull();
  });
});
