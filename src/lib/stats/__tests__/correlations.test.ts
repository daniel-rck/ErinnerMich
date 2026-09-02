import { describe, expect, it } from "vitest";
import type { MoodEntry, Reminder, ReminderEvent } from "../../types";
import { habitMoodCorrelations, pearson } from "../correlations";

describe("pearson", () => {
  it("liefert +1 für perfekt positive Korrelation", () => {
    const r = pearson([1, 2, 3], [2, 4, 6]);
    expect(r).toBeCloseTo(1);
  });

  it("liefert -1 für perfekt negative Korrelation", () => {
    const r = pearson([1, 2, 3], [6, 4, 2]);
    expect(r).toBeCloseTo(-1);
  });

  it("liefert ~0 für Unkorreliertes", () => {
    const r = pearson([1, 2, 3, 4], [2, 1, 2, 1]) ?? 0;
    expect(Math.abs(r)).toBeLessThan(0.5);
  });

  it("liefert null bei zu wenigen Samples", () => {
    expect(pearson([], [])).toBeNull();
    expect(pearson([1], [1])).toBeNull();
  });

  it("liefert null bei Null-Varianz", () => {
    expect(pearson([1, 1, 1], [2, 4, 6])).toBeNull();
    expect(pearson([1, 2, 3], [5, 5, 5])).toBeNull();
  });

  it("wirft bei unterschiedlichen Längen", () => {
    expect(() => pearson([1, 2], [1, 2, 3])).toThrow();
  });
});

const habit: Reminder = {
  id: "h-1",
  kind: "habit",
  title: "Sport",
  icon: "🏋️",
  category: "fitness",
  color: "emerald",
  schedule: { type: "daily", times: ["18:00"] },
  streakSensitive: true,
  active: true,
  createdAt: 0,
  updatedAt: 0,
};

function ts(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

function moodEntry(day: number, mood: 1 | 2 | 3 | 4 | 5): MoodEntry {
  return {
    id: `m-${day}-${mood}`,
    loggedAt: ts(2026, 4, day),
    mood,
  };
}

function completionEvent(day: number, habitId: string): ReminderEvent {
  return {
    id: `e-${day}`,
    reminderId: habitId,
    action: "completed",
    triggeredAt: ts(2026, 4, day),
  };
}

describe("habitMoodCorrelations", () => {
  it("paart Habit-Tage mit Mood-Tagen über überlappende Tage", () => {
    const moods = [moodEntry(1, 2), moodEntry(2, 5), moodEntry(3, 5), moodEntry(4, 2)];
    const events = [completionEvent(2, habit.id), completionEvent(3, habit.id)];
    const [row] = habitMoodCorrelations([habit], events, moods);
    if (!row) throw new Error("expected a correlation row");
    expect(row.pairs).toBe(4);
    // Sport-Tage haben mood=5, off-Tage mood=2 → r = +1
    expect(row.r).toBeCloseTo(1);
  });

  it("liefert null bei nur einem überlappenden Mood-Tag", () => {
    const moods = [moodEntry(1, 3)];
    const [row] = habitMoodCorrelations([habit], [], moods);
    if (!row) throw new Error("expected a correlation row");
    expect(row.pairs).toBe(1);
    expect(row.r).toBeNull();
  });

  it("ignoriert Tage ohne Mood-Eintrag", () => {
    const moods = [moodEntry(1, 3), moodEntry(2, 4)];
    // Habit hat zusätzlich am 5. fertig, aber kein Mood → wird nicht gepaart
    const events = [completionEvent(2, habit.id), completionEvent(5, habit.id)];
    const [row] = habitMoodCorrelations([habit], events, moods);
    if (!row) throw new Error("expected a correlation row");
    expect(row.pairs).toBe(2);
  });
});
