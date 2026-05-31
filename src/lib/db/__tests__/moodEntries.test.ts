import { describe, expect, it } from "vitest";
import { dayKey } from "..";
import {
  addMoodEntry,
  dailyMoodAverage,
  deleteMoodEntry,
  listMoodEntriesForDay,
  listMoodEntriesInRange,
} from "../moodEntries";

describe("mood entries", () => {
  it("legt einen MoodEntry an und liest ihn per Tag", async () => {
    const t = new Date("2026-05-04T18:00:00Z").getTime();
    await addMoodEntry({ loggedAt: t, mood: 4 });
    const day = await listMoodEntriesForDay(dayKey(t));
    expect(day).toHaveLength(1);
    expect(day[0].mood).toBe(4);
  });

  it("listet Entries in Zeitbereich", async () => {
    const a = new Date("2026-05-01T08:00:00Z").getTime();
    const b = new Date("2026-05-03T08:00:00Z").getTime();
    const c = new Date("2026-05-10T08:00:00Z").getTime();
    await addMoodEntry({ loggedAt: a, mood: 3 });
    await addMoodEntry({ loggedAt: b, mood: 5 });
    await addMoodEntry({ loggedAt: c, mood: 2 });

    const range = await listMoodEntriesInRange(a, b);
    expect(range).toHaveLength(2);
    expect(range[0].mood).toBe(5);
    expect(range[1].mood).toBe(3);
  });

  it("berechnet Tagesdurchschnitt für Mood + Energy", async () => {
    const t = new Date("2026-05-04T08:00:00Z").getTime();
    await addMoodEntry({ loggedAt: t, mood: 4, energy: 3 });
    await addMoodEntry({ loggedAt: t + 3600_000, mood: 2, energy: 5 });
    await addMoodEntry({ loggedAt: t + 7200_000, mood: 5 });

    const avg = await dailyMoodAverage(dayKey(t));
    expect(avg.count).toBe(3);
    expect(avg.avgMood).toBeCloseTo((4 + 2 + 5) / 3);
    expect(avg.avgEnergy).toBeCloseTo((3 + 5) / 2);
  });

  it("liefert leere Aggregation für Tage ohne Einträge", async () => {
    const avg = await dailyMoodAverage("2030-01-01");
    expect(avg.count).toBe(0);
    expect(avg.avgEnergy).toBeNull();
  });

  it("löscht einen MoodEntry", async () => {
    const e = await addMoodEntry({ loggedAt: Date.now(), mood: 3 });
    await deleteMoodEntry(e.id);
    const all = await listMoodEntriesInRange(0, Date.now() + 10_000);
    expect(all).toHaveLength(0);
  });
});
