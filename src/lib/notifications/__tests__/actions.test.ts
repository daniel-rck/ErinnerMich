import { describe, expect, it } from "vitest";
import type { Reminder } from "../../types";
import { actionsForKind, buildDescriptor, notificationTag } from "../actions";

const baseReminder: Reminder = {
  id: "r-1",
  kind: "reminder",
  title: "Pflanze gießen",
  icon: "🪴",
  category: "plant",
  color: "emerald",
  schedule: { type: "elapsed", days: 5 },
  streakSensitive: false,
  active: true,
  createdAt: 0,
  updatedAt: 0,
};

describe("notification actions", () => {
  it("reminders bekommen Done/Snooze/Skip-Actions", () => {
    const actions = actionsForKind("reminder").map((a) => a.action);
    expect(actions).toEqual(["done", "snooze-30", "skip"]);
  });

  it("habits bekommen +1 zusätzlich", () => {
    const actions = actionsForKind("habit").map((a) => a.action);
    expect(actions).toContain("+1");
  });

  it("mood bekommt fünf Emoji-Actions", () => {
    const actions = actionsForKind("mood").map((a) => a.action);
    expect(actions).toEqual(["mood-1", "mood-2", "mood-3", "mood-4", "mood-5"]);
  });

  it("notificationTag enthält reminderId und Timestamp", () => {
    const tag = notificationTag("abc", 1700000000000);
    expect(tag).toBe("reminder-abc-1700000000000");
  });

  it("buildDescriptor packt Kontext in data und tag", () => {
    const desc = buildDescriptor(baseReminder, new Date(1700000000000));
    expect(desc.tag).toBe("reminder-r-1-1700000000000");
    expect(desc.data).toEqual({
      reminderId: "r-1",
      kind: "reminder",
      scheduledFor: 1700000000000,
    });
    expect(desc.title).toContain("Pflanze gießen");
  });

  it("buildDescriptor nutzt promptText für Mood-Reminder", () => {
    const moodReminder: Reminder = {
      ...baseReminder,
      kind: "mood",
      moodConfig: {
        scale: "five-emoji",
        promptText: "Wie war heute?",
        tags: [],
      },
    };
    const desc = buildDescriptor(moodReminder, new Date(0));
    expect(desc.body).toBe("Wie war heute?");
    expect(desc.actions).toHaveLength(5);
  });
});
