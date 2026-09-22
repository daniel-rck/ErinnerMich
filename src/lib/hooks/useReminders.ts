import { listReminders } from "../db/reminders";
import type { Reminder, ReminderKind } from "../types";
import { useDbQuery } from "./useDbQuery";

export type UseRemindersOptions = {
  kind?: ReminderKind;
  activeOnly?: boolean;
  includeArchived?: boolean;
};

export function useReminders(options: UseRemindersOptions = {}): {
  reminders: Reminder[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
} {
  const { kind, activeOnly, includeArchived } = options;
  const { data, loading, error, reload } = useDbQuery<Reminder[]>(
    () => listReminders({ kind, activeOnly, includeArchived }),
    [],
    (message) => message.type === "reminder-changed" || message.type === "reminder-deleted",
    [kind, activeOnly, includeArchived],
  );
  return { reminders: data, loading, error, reload };
}

export function useHabits(activeOnly = true) {
  return useReminders({ kind: "habit", activeOnly });
}

export function useMoodReminders(activeOnly = true) {
  return useReminders({ kind: "mood", activeOnly });
}
