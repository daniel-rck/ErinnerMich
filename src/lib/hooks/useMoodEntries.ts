import type { BroadcastMessage } from "../db/broadcast";
import { dailyMoodAverage, listMoodEntriesForDay, listMoodEntriesInRange } from "../db/moodEntries";
import type { MoodEntry } from "../types";
import { useDbQuery } from "./useDbQuery";

function touchesMood(message: BroadcastMessage): boolean {
  return message.type === "mood-added" || message.type === "mood-deleted";
}

/**
 * Entries logged at or after `fromMs`. `toMs` defaults to open-ended so an
 * entry logged while the page is open still lands in the range.
 */
export function useMoodEntriesInRange(
  fromMs: number,
  toMs: number = Number.POSITIVE_INFINITY,
): { entries: MoodEntry[]; loading: boolean; reload: () => Promise<void> } {
  const { data, loading, reload } = useDbQuery<MoodEntry[]>(
    () => listMoodEntriesInRange(fromMs, toMs),
    [],
    touchesMood,
    [fromMs, toMs],
  );
  return { entries: data, loading, reload };
}

export function useMoodEntriesForDay(day: string) {
  const { data, loading, reload } = useDbQuery<MoodEntry[]>(
    () => listMoodEntriesForDay(day),
    [],
    touchesMood,
    [day],
  );
  return { entries: data, loading, reload };
}

export function useDailyMoodAverage(day: string) {
  const { data, loading } = useDbQuery(
    () => dailyMoodAverage(day),
    { avgMood: 0, avgEnergy: null as number | null, count: 0 },
    touchesMood,
    [day],
  );
  return { ...data, loading };
}
