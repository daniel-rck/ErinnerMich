import type { BroadcastMessage } from "../db/broadcast";
import { dailyProgress, listEventsForReminder } from "../db/events";
import type { ReminderEvent } from "../types";
import { useDbQuery } from "./useDbQuery";

function touchesEventsOf(reminderId: string | null) {
  return (message: BroadcastMessage) =>
    ((message.type === "event-added" || message.type === "event-deleted") &&
      message.reminderId === reminderId) ||
    (message.type === "reminder-deleted" && message.id === reminderId);
}

export function useEvents(reminderId: string | null): {
  events: ReminderEvent[];
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { data, loading, reload } = useDbQuery<ReminderEvent[]>(
    async () => (reminderId ? listEventsForReminder(reminderId) : []),
    [],
    touchesEventsOf(reminderId),
    [reminderId],
  );
  return { events: data, loading, reload };
}

export function useDailyProgress(
  reminderId: string | null,
  date: number | string,
): { completions: number; sum: number; loading: boolean } {
  const { data, loading } = useDbQuery(
    async () => (reminderId ? dailyProgress(reminderId, date) : { completions: 0, sum: 0 }),
    { completions: 0, sum: 0 },
    touchesEventsOf(reminderId),
    [reminderId, date],
  );
  return { completions: data.completions, sum: data.sum, loading };
}
