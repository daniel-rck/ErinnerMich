import { listToolEntries } from "../db/toolEntries";
import type { ToolEntry, ToolKey } from "../types";
import { useDbQuery } from "./useDbQuery";

export function useToolEntries(options?: { toolKey?: ToolKey; since?: number; until?: number }): {
  entries: ToolEntry[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
} {
  const toolKey = options?.toolKey;
  const since = options?.since;
  const until = options?.until;
  const { data, loading, error, reload } = useDbQuery<ToolEntry[]>(
    () => listToolEntries({ toolKey, since, until }),
    [],
    (message) => message.type === "tool-added" || message.type === "tool-deleted",
    [toolKey, since, until],
  );
  return { entries: data, loading, error, reload };
}
