import { describe, expect, it } from "vitest";
import type { Reminder } from "../../types";
import { clearAllTriggers, clearReminderTriggers, planTriggers } from "../triggers";

const baseReminder: Reminder = {
  id: "r-1",
  kind: "reminder",
  title: "Test",
  icon: "⏰",
  category: "other",
  color: "emerald",
  schedule: { type: "daily", times: ["09:00", "20:00"] },
  streakSensitive: false,
  active: true,
  createdAt: 0,
  updatedAt: 0,
};

describe("planTriggers", () => {
  it("gibt nichts zurück, wenn der Reminder inaktiv ist", () => {
    const inactive = { ...baseReminder, active: false };
    expect(planTriggers(inactive, new Date("2026-01-01T08:00:00Z"))).toEqual([]);
  });

  it("plant n=5 daily-Triggers chronologisch", () => {
    const planned = planTriggers(baseReminder, new Date("2026-01-01T07:00:00"), 5);
    expect(planned).toHaveLength(5);
    const stamps = planned.map((p) => p.scheduledFor.getTime());
    const sorted = [...stamps].sort((a, b) => a - b);
    expect(stamps).toEqual(sorted);
  });

  it("expandiert expires-Schedules zu allen PreWarnings", () => {
    const expiresAt = new Date("2027-01-01T12:00:00Z").getTime();
    const expiresReminder: Reminder = {
      ...baseReminder,
      schedule: {
        type: "expires",
        expiresAt,
        preWarnings: [
          { kind: "months", value: 6 },
          { kind: "months", value: 1 },
          { kind: "days", value: 7 },
        ],
      },
    };
    const planned = planTriggers(expiresReminder, new Date("2026-01-01T00:00:00Z"), 10);
    expect(planned.length).toBeGreaterThanOrEqual(4);
    expect(planned.at(-1)?.scheduledFor.getTime()).toBe(expiresAt);
  });

  it("liefert für inventory_based keinen Trigger", () => {
    const inv: Reminder = {
      ...baseReminder,
      schedule: { type: "inventory_based" },
    };
    expect(planTriggers(inv, new Date())).toEqual([]);
  });
});

describe("planTriggers with an overdue elapsed reminder", () => {
  it("plans nothing in the past", () => {
    const reminder: Reminder = {
      ...baseReminder,
      schedule: { type: "elapsed", days: 3, lastDone: new Date(2026, 0, 1).getTime() },
    };
    expect(planTriggers(reminder, new Date(2026, 5, 1))).toEqual([]);
  });
});

describe("clearing notifications", () => {
  function fakeRegistration(tags: string[]) {
    const closed: string[] = [];
    const registration = {
      getNotifications: async () => tags.map((tag) => ({ tag, close: () => closed.push(tag) })),
    } as unknown as ServiceWorkerRegistration;
    return { registration, closed };
  }

  it("leaves the low-stock ping alone on a re-arm but closes it when the reminder goes", async () => {
    const tags = ["reminder-r-1-100", "lowstock-r-1", "lowstock-r-2"];
    const rearm = fakeRegistration(tags);
    await clearReminderTriggers(rearm.registration, "r-1");
    expect(rearm.closed).toEqual(["reminder-r-1-100"]);

    const gone = fakeRegistration(tags);
    await clearReminderTriggers(gone.registration, "r-1", { includeLowStock: true });
    expect(gone.closed).toEqual(["reminder-r-1-100", "lowstock-r-1"]);
  });

  it("closes low-stock pings on a full clear", async () => {
    const all = fakeRegistration(["reminder-a-1", "lowstock-b", "test-notification"]);
    await clearAllTriggers(all.registration);
    expect(all.closed).toEqual(["reminder-a-1", "lowstock-b"]);
  });
});
