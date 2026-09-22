import { listReminders } from "../db/reminders";
import { dayKeyForDate, diffDays } from "../stats/dayKey";
import type { Reminder } from "../types";
import { useDbQuery } from "./useDbQuery";

export type ExpiringReminder = {
  reminder: Reminder;
  expiresAt: number;
  daysRemaining: number;
};

export function useExpiryRadar(now?: number): {
  items: ExpiringReminder[];
  loading: boolean;
} {
  const { data, loading } = useDbQuery<ExpiringReminder[]>(
    async () => {
      const referenceKey = dayKeyForDate(new Date(now ?? Date.now()));
      const all = await listReminders({ activeOnly: true });
      const expiring: ExpiringReminder[] = [];
      for (const reminder of all) {
        if (reminder.schedule.type !== "expires") continue;
        const expiresAt = reminder.schedule.expiresAt;
        // Calendar days, not 24h blocks — a DST weekend must not add a day.
        const daysRemaining = diffDays(dayKeyForDate(new Date(expiresAt)), referenceKey);
        expiring.push({ reminder, expiresAt, daysRemaining });
      }
      return expiring.toSorted((a, b) => a.expiresAt - b.expiresAt);
    },
    [],
    (message) => message.type === "reminder-changed" || message.type === "reminder-deleted",
    [now],
  );
  return { items: data, loading };
}
