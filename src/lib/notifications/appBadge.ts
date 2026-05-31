import { dayKey } from "../db";
import { listEventsForDay } from "../db/events";
import { listLowStock } from "../db/inventories";
import { listReminders } from "../db/reminders";
import { nextOccurrence } from "../schedule/nextOccurrence";

type BadgeApi = {
  setAppBadge: (count?: number) => Promise<void>;
  clearAppBadge: () => Promise<void>;
};

function badgeApi(): BadgeApi | null {
  if (typeof navigator === "undefined") return null;
  const n = navigator as unknown as Partial<BadgeApi>;
  if (typeof n.setAppBadge !== "function") return null;
  if (typeof n.clearAppBadge !== "function") return null;
  return n as BadgeApi;
}

/**
 * Counts items that warrant user attention right now:
 * - Active non-habit reminders whose next occurrence already lapsed
 *   and aren't completed today.
 * - Inventories at or below threshold.
 */
export async function refreshAppBadge(): Promise<void> {
  const api = badgeApi();
  if (!api) return;
  try {
    const now = new Date();
    const today = dayKey(now.getTime());
    const [active, lowStock, todayEvents] = await Promise.all([
      listReminders({ activeOnly: true }),
      listLowStock(),
      listEventsForDay(today),
    ]);

    const completedToday = new Set(
      todayEvents.filter((e) => e.action === "completed").map((e) => e.reminderId),
    );

    let overdue = 0;
    for (const r of active) {
      if (r.kind !== "reminder") continue;
      if (completedToday.has(r.id)) continue;
      const earlier = new Date(now.getTime() - 60_000);
      const next = nextOccurrence(r.schedule, earlier);
      if (!next) continue;
      if (next.getTime() <= now.getTime()) overdue += 1;
    }

    const total = overdue + lowStock.length;
    if (total > 0) await api.setAppBadge(total);
    else await api.clearAppBadge();
  } catch {
    /* badge is best-effort */
  }
}
