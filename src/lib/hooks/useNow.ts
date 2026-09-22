import { useEffect, useState } from "react";

/**
 * The current time, refreshed every `intervalMs` and whenever the tab becomes
 * visible again. Screens that bucket by "now" or "today" (timeline, greeting,
 * habit progress) otherwise freeze at mount — an installed PWA left open past
 * midnight kept showing yesterday.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return now;
}

/** Today's day key ("YYYY-MM-DD"), rolling over at local midnight. */
export function useTodayKey(): string {
  const now = useNow();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
