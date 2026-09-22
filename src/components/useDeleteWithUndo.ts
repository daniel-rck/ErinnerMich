import { useCallback } from "react";
import { archiveReminder, deleteReminder, restoreReminder } from "../lib/db/reminders";
import type { Reminder } from "../lib/types";
import { useToast } from "./ui/Toast";

export const DELETE_GRACE_MS = 5500;

/**
 * Delete with an undo toast: archive now, hard-delete when the toast's undo
 * window closes. Undo restores the reminder's previous `active` flag — a
 * paused reminder must not come back notifying.
 */
export function useDeleteWithUndo(): (reminder: Reminder) => Promise<void> {
  const toast = useToast();
  return useCallback(
    async (reminder: Reminder) => {
      const wasActive = await archiveReminder(reminder.id);
      let cancelled = false;
      const timer = setTimeout(() => {
        if (!cancelled) void deleteReminder(reminder.id);
      }, DELETE_GRACE_MS);
      toast.show({
        variant: "success",
        message: `„${reminder.title}“ gelöscht`,
        durationMs: DELETE_GRACE_MS,
        action: {
          label: "Rückgängig",
          onClick: () => {
            cancelled = true;
            clearTimeout(timer);
            void restoreReminder(reminder.id, wasActive);
          },
        },
      });
    },
    [toast],
  );
}
