import { subscribe } from "../db/broadcast";
import { getInventory } from "../db/inventories";
import { getReminder } from "../db/reminders";
import type { Inventory, Reminder } from "../types";
import { notificationTag } from "./actions";

let started = false;
let unsubscribe: (() => void) | null = null;
const lastNotifiedAt = new Map<string, number>();

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 h between repeat low-stock pings

export function shouldNotifyLowStock(
  inventory: Inventory,
  now: number,
  history: ReadonlyMap<string, number> = lastNotifiedAt,
): boolean {
  if (inventory.remaining > inventory.refillThreshold) return false;
  const last = history.get(inventory.reminderId);
  if (last === undefined) return true;
  return now - last >= COOLDOWN_MS;
}

export function startInventoryWatcher(): () => void {
  if (started) return stopInventoryWatcher;
  started = true;
  unsubscribe = subscribe((message) => {
    if (message.type !== "inventory-changed") return;
    void check(message.reminderId);
  });
  return stopInventoryWatcher;
}

export function stopInventoryWatcher(): void {
  if (!started) return;
  unsubscribe?.();
  unsubscribe = null;
  started = false;
  lastNotifiedAt.clear();
}

async function check(reminderId: string): Promise<void> {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const inventory = await getInventory(reminderId);
  if (!inventory) return;
  const now = Date.now();
  if (!shouldNotifyLowStock(inventory, now)) return;

  const reminder = await getReminder(reminderId);
  if (!reminder || !reminder.active) return;

  await fireLowStockNotification(reminder, inventory, now);
  lastNotifiedAt.set(reminderId, now);
}

async function fireLowStockNotification(
  reminder: Reminder,
  inventory: Inventory,
  now: number,
): Promise<void> {
  const title = `${reminder.icon} ${reminder.title} – Vorrat niedrig`;
  const body = `Noch ${inventory.remaining} ${inventory.unit} (Schwelle: ${inventory.refillThreshold}).`;
  const options: NotificationOptions = {
    tag: notificationTag(reminder.id, now),
    body,
    data: {
      reminderId: reminder.id,
      kind: reminder.kind,
      scheduledFor: now,
      reason: "low-stock",
    },
  };
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return;
    } catch {
      // fall through to direct Notification
    }
  }
  new Notification(title, options);
}

export function _resetInventoryWatcherForTests(): void {
  unsubscribe?.();
  unsubscribe = null;
  started = false;
  lastNotifiedAt.clear();
}
