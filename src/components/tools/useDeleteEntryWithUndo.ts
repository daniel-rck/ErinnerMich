import { useCallback } from "react";
import { deleteToolEntry, restoreToolEntry } from "../../lib/db/toolEntries";
import type { ToolEntry } from "../../lib/types";
import { useToast } from "../ui/Toast";

/** One tap deleted a gratitude note, treasure or worry for good — now it can be undone. */
export function useDeleteEntryWithUndo(message: string): (entry: ToolEntry) => Promise<void> {
  const toast = useToast();
  return useCallback(
    async (entry: ToolEntry) => {
      await deleteToolEntry(entry.id);
      toast.show({
        message,
        action: { label: "Rückgängig", onClick: () => void restoreToolEntry(entry) },
      });
    },
    [toast, message],
  );
}
