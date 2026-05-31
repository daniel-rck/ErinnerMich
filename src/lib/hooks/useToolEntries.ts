import { useCallback, useEffect, useState } from "react";
import { subscribe } from "../db/broadcast";
import { listToolEntries } from "../db/toolEntries";
import type { ToolEntry, ToolKey } from "../types";

export function useToolEntries(options?: { toolKey?: ToolKey; since?: number; until?: number }): {
  entries: ToolEntry[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
} {
  const toolKey = options?.toolKey;
  const since = options?.since;
  const until = options?.until;
  const [entries, setEntries] = useState<ToolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await listToolEntries({ toolKey, since, until });
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [toolKey, since, until]);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribe((message) => {
      if (
        message.type === "tool-added" ||
        message.type === "tool-deleted" ||
        message.type === "db-cleared"
      ) {
        void reload();
      }
    });
    return unsubscribe;
  }, [reload]);

  return { entries, loading, error, reload };
}
