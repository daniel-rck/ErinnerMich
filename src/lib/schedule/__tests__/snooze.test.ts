import { describe, expect, it } from "vitest";
import type { ReminderEvent } from "../../types";
import { pendingSnoozes } from "../snooze";

function event(partial: Partial<ReminderEvent>): ReminderEvent {
  return { id: String(Math.random()), reminderId: "r", action: "completed", ...partial };
}

describe("pendingSnoozes", () => {
  const now = 1_000_000;
  const slotA = 500_000;
  const slotB = 900_000;

  it("returns an active snooze with its slot", () => {
    const events = [
      event({ action: "completed", triggeredAt: now - 5000, scheduledFor: slotA }),
      event({
        action: "snoozed",
        triggeredAt: now - 1000,
        scheduledFor: slotA,
        snoozeUntil: now + 60_000,
      }),
      event({ action: "progress", triggeredAt: now }),
    ];
    expect(pendingSnoozes(events, now)).toEqual([{ until: now + 60_000, slot: slotA }]);
  });

  it("is cancelled by a later completion of the same slot only", () => {
    const events = [
      event({
        action: "snoozed",
        triggeredAt: now - 1000,
        scheduledFor: slotA,
        snoozeUntil: now + 60_000,
      }),
      event({ action: "completed", triggeredAt: now - 500, scheduledFor: slotB }),
    ];
    expect(pendingSnoozes(events, now)).toEqual([{ until: now + 60_000, slot: slotA }]);

    events.push(event({ action: "completed", triggeredAt: now - 100, scheduledFor: slotA }));
    expect(pendingSnoozes(events, now)).toEqual([]);
  });

  it("drops a snooze that already ran out", () => {
    const events = [event({ action: "snoozed", triggeredAt: now - 9000, snoozeUntil: now - 1 })];
    expect(pendingSnoozes(events, now)).toEqual([]);
  });
});
