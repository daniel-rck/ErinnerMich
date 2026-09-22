import { dayKey } from "../db";
import { listEventsForDay } from "../db/events";
import { listLowStock } from "../db/inventories";
import { listReminders } from "../db/reminders";
import { startOfDay } from "../schedule/helpers";
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

    // An occurrence is overdue once it passed today without a completion.
    // Looking from the start of the day (not just the last minute) keeps a
    // 08:00 pill counted at 10:00.
    const dayStart = startOfDay(now);
    let overdue = 0;
    for (const r of active) {
      if (r.kind !== "reminder") continue;
      if (completedToday.has(r.id)) continue;
      try {
        const next = nextOccurrence(r.schedule, dayStart);
        if (next && next.getTime() <= now.getTime()) overdue += 1;
      } catch {
        // An invalid schedule shouldn't zero the whole badge.
      }
    }

    const total = overdue + lowStock.length;
    if (total > 0) await api.setAppBadge(total);
    else await api.clearAppBadge();
  } catch {
    /* badge is best-effort */
  }
}
