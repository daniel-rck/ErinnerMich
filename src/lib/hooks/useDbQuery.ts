import { useCallback, useEffect, useRef, useState } from "react";
import { type BroadcastMessage, subscribe } from "../db/broadcast";

export type DbQueryResult<T> = {
  data: T;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

/**
 * Shared engine behind the `use*` data hooks: runs `query`, re-runs it when a
 * broadcast matches `shouldReload`, and commits only the newest run.
 *
 * Latest-wins: a broadcast can start a run while an earlier one is still
 * awaiting, and IndexedDB gives no ordering guarantee between them — without
 * the token the slower, older query could land last and overwrite fresh data.
 * Bumping the token in the effect cleanup also drops results that arrive after
 * unmount or after the deps changed (e.g. `/detail/A` → `/detail/B`).
 */
export function useDbQuery<T>(
  query: () => Promise<T>,
  initial: T,
  shouldReload: (message: BroadcastMessage) => boolean,
  deps: readonly unknown[],
): DbQueryResult<T> {
  const [state, setState] = useState<{ data: T; loading: boolean; error: Error | null }>({
    data: initial,
    loading: true,
    error: null,
  });
  const runToken = useRef(0);
  const queryRef = useRef(query);
  const shouldReloadRef = useRef(shouldReload);
  // oxlint-disable-next-line react/refs -- latest-ref: runs must use the newest closures without re-subscribing on every render
  queryRef.current = query;
  // oxlint-disable-next-line react/refs -- latest-ref, see above
  shouldReloadRef.current = shouldReload;

  const run = useCallback(async () => {
    const token = ++runToken.current;
    try {
      const data = await queryRef.current();
      if (token === runToken.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (token === runToken.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      }
    }
  }, []);

  useEffect(() => {
    void run();
    const unsubscribe = subscribe((message) => {
      if (message.type === "db-cleared" || shouldReloadRef.current(message)) void run();
    });
    return () => {
      // oxlint-disable-next-line react/exhaustive-deps -- intentional: invalidates whatever run is in flight
      runToken.current++;
      unsubscribe();
    };
    // oxlint-disable-next-line react/exhaustive-deps -- `deps` is the caller's dependency list, forwarded as-is
  }, [run, ...deps]);

  return { ...state, reload: run };
}
