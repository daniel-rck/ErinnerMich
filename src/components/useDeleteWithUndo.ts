import { useCallback } from "react";
import { archiveReminder, deleteReminder, restoreReminder } from "../lib/db/reminders";
import type { Reminder } from "../lib/types";
import { useToast } from "./ui/Toast";

/**
 * Delete with an undo toast: archive now, hard-delete once the toast goes away
 * without "Rückgängig". Undo restores the reminder's previous `active` flag —
 * a paused reminder must not come back notifying. If the tab closes first,
 * the startup sweep (`purgeArchivedReminders`) finishes the delete.
 */
export function useDeleteWithUndo(): (reminder: Reminder) => Promise<void> {
  const toast = useToast();
  return useCallback(
    async (reminder: Reminder) => {
      const wasActive = await archiveReminder(reminder.id);
      toast.show({
        variant: "success",
        message: `„${reminder.title}“ gelöscht`,
        action: {
          label: "Rückgängig",
          onClick: () => void restoreReminder(reminder.id, wasActive),
        },
        onExpire: () => void deleteReminder(reminder.id),
      });
    },
    [toast],
  );
}
