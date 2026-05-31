import type { MoodEntry } from "../types";
import { dayKeyForDate, lastNDayKeys } from "./dayKey";

export interface DailyMoodPoint {
  day: string;
  avgMood: number | null;
  count: number;
}

export function dailyMoodSeries(
  entries: readonly MoodEntry[],
  windowDays: number,
  today: Date = new Date(),
): DailyMoodPoint[] {
  const days = lastNDayKeys(windowDays, today);
  const buckets = new Map<string, MoodEntry[]>();
  for (const entry of entries) {
    const key = dayKeyForDate(new Date(entry.loggedAt));
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(entry);
  }
  return days.map((day) => {
    const bucket = buckets.get(day) ?? [];
    if (bucket.length === 0) {
      return { day, avgMood: null, count: 0 };
    }
    const sum = bucket.reduce((acc, e) => acc + e.mood, 0);
    return { day, avgMood: sum / bucket.length, count: bucket.length };
  });
}

const WEEKDAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;

export interface WeekdayMoodPoint {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  label: (typeof WEEKDAY_LABELS)[number];
  avgMood: number | null;
  count: number;
}

export function moodByWeekday(entries: readonly MoodEntry[]): WeekdayMoodPoint[] {
  const sums = new Array<number>(7).fill(0);
  const counts = new Array<number>(7).fill(0);
  for (const entry of entries) {
    const wd = new Date(entry.loggedAt).getDay();
    sums[wd] += entry.mood;
    counts[wd] += 1;
  }
  return WEEKDAY_LABELS.map((label, weekday) => ({
    weekday: weekday as WeekdayMoodPoint["weekday"],
    label,
    avgMood: counts[weekday] > 0 ? sums[weekday] / counts[weekday] : null,
    count: counts[weekday],
  }));
}

export interface MoodOverview {
  count: number;
  avgMood: number | null;
  avgEnergy: number | null;
  bestDay: { day: string; avg: number } | null;
  worstDay: { day: string; avg: number } | null;
}

export function moodOverview(
  entries: readonly MoodEntry[],
  windowDays: number,
  today: Date = new Date(),
): MoodOverview {
  if (entries.length === 0) {
    return {
      count: 0,
      avgMood: null,
      avgEnergy: null,
      bestDay: null,
      worstDay: null,
    };
  }
  const moodSum = entries.reduce((acc, e) => acc + e.mood, 0);
  const energy = entries
    .map((e) => e.energy)
    .filter((v): v is NonNullable<typeof v> => v !== undefined);
  const avgEnergy = energy.length > 0 ? energy.reduce((a, b) => a + b, 0) / energy.length : null;

  const series = dailyMoodSeries(entries, windowDays, today).filter((p) => p.avgMood !== null);
  let best = series[0] ?? null;
  let worst = series[0] ?? null;
  for (const p of series) {
    if (best === null || (p.avgMood ?? 0) > (best.avgMood ?? 0)) best = p;
    if (worst === null || (p.avgMood ?? 0) < (worst.avgMood ?? 0)) worst = p;
  }
  return {
    count: entries.length,
    avgMood: moodSum / entries.length,
    avgEnergy,
    bestDay: best && best.avgMood !== null ? { day: best.day, avg: best.avgMood } : null,
    worstDay: worst && worst.avgMood !== null ? { day: worst.day, avg: worst.avgMood } : null,
  };
}

/**
 * Tag rollup: how often each tag occurs and the average mood on entries
 * tagged with it. Surfaces "stress" → low mood / "sport" → high mood patterns.
 */
export interface TagBucket {
  tag: string;
  count: number;
  avgMood: number;
}

export function tagRollup(entries: readonly MoodEntry[]): TagBucket[] {
  const counts = new Map<string, { count: number; sum: number }>();
  for (const entry of entries) {
    if (!entry.tags) continue;
    for (const tag of entry.tags) {
      const bucket = counts.get(tag) ?? { count: 0, sum: 0 };
      bucket.count += 1;
      bucket.sum += entry.mood;
      counts.set(tag, bucket);
    }
  }
  return [...counts.entries()]
    .map(([tag, b]) => ({ tag, count: b.count, avgMood: b.sum / b.count }))
    .sort((a, b) => b.count - a.count);
}
