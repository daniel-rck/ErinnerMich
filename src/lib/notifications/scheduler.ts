import { type BroadcastMessage, subscribe } from "../db/broadcast";
import { listEventsForReminder } from "../db/events";
import { getReminder, listReminders } from "../db/reminders";
import { pendingSnoozes } from "../schedule/snooze";
import type { Reminder } from "../types";
import { armInTabTimers, clearAllInTabTimers, clearInTabTimers } from "./inTab";
import {
  armReminderTriggers,
  clearAllTriggers,
  clearReminderTriggers,
  supportsNotificationTriggers,
} from "./triggers";

let started = false;
let unsubscribe: (() => void) | null = null;
let rearmInterval: ReturnType<typeof setInterval> | null = null;

// In-tab timers only cover the next 24 h (INTAB_HORIZON_MS) and are not
// re-armed after they fire. A long-lived tab/PWA window would stop notifying
// without this periodic re-arm that keeps the rolling horizon filled.
const REARM_INTERVAL_MS = 60 * 60 * 1000;

export interface SchedulerStatus {
  mode: "triggers" | "in-tab" | "unsupported";
  hasPermission: boolean;
}

export function schedulerStatus(): SchedulerStatus {
  if (typeof Notification === "undefined") {
    return { mode: "unsupported", hasPermission: false };
  }
  return {
    mode: supportsNotificationTriggers() ? "triggers" : "in-tab",
    hasPermission: Notification.permission === "granted",
  };
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return (await navigator.serviceWorker.ready) ?? null;
  } catch {
    return null;
  }
}

// Re-arms of one reminder run one after another. Each clears and recreates
// all of its notifications, so two overlapping ones (a snooze, then a quick
// completion) could otherwise finish in the wrong order and bring back the
// snooze the completion had just cancelled.
const queues = new Map<string, Promise<void>>();

function serialized(reminderId: string, job: () => Promise<void>): Promise<void> {
  const previous = queues.get(reminderId) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(job);
  queues.set(reminderId, next);
  void next
    .catch(() => {})
    .finally(() => {
      if (queues.get(reminderId) === next) queues.delete(reminderId);
    });
  return next;
}

async function armNow(reminder: Reminder): Promise<void> {
  const status = schedulerStatus();
  if (status.mode === "unsupported" || !status.hasPermission) return;

  const now = Date.now();
  // Read inside the queue, so each run sees the events of everything before it.
  const snoozes = pendingSnoozes(await listEventsForReminder(reminder.id), now);
  const registration = await getRegistration();
  if (status.mode === "triggers" && registration) {
    await armReminderTriggers(registration, reminder, new Date(now), snoozes);
  } else {
    armInTabTimers(registration, reminder, now, snoozes);
  }
}

async function clearNow(reminderId: string): Promise<void> {
  clearInTabTimers(reminderId);
  const registration = await getRegistration();
  if (registration) {
    await clearReminderTriggers(registration, reminderId, { includeLowStock: true });
  }
}

export function rearmReminder(reminder: Reminder): Promise<void> {
  return serialized(reminder.id, () => armNow(reminder));
}

export function clearReminder(reminderId: string): Promise<void> {
  return serialized(reminderId, () => clearNow(reminderId));
}

/** Re-arms from the current DB state (or clears when inactive/gone), queued per reminder. */
function syncReminder(reminderId: string): Promise<void> {
  return serialized(reminderId, async () => {
    const reminder = await getReminder(reminderId);
    if (reminder?.active) await armNow(reminder);
    else await clearNow(reminderId);
  });
}

export async function rearmAll(): Promise<void> {
  const status = schedulerStatus();
  if (status.mode === "unsupported" || !status.hasPermission) return;
  const reminders = await listReminders({ activeOnly: true });
  for (const reminder of reminders) {
    // One reminder with a schedule the engines reject (e.g. an imported
    // `times: []`) must not keep every reminder after it from being armed.
    try {
      await rearmReminder(reminder);
    } catch (err) {
      console.error(`[notifications] Re-Arm für ${reminder.id} fehlgeschlagen:`, err);
    }
  }
}

/**
 * Subscribes to the DB broadcast channel and re-arms / clears notifications
 * automatically when reminders change. Idempotent — calling twice is a no-op.
 */
export function startScheduler(): () => void {
  if (started) return stopScheduler;
  started = true;

  unsubscribe = subscribe((message) => {
    handleMessage(message).catch((err) => {
      console.error("[notifications] Re-Arm nach DB-Broadcast fehlgeschlagen:", err);
    });
  });
  rearmInterval = setInterval(() => {
    // Nur der In-Tab-Horizont muss periodisch nachgefüllt werden — via
    // Triggers API armierte Notifications überleben ohne Re-Arm. Dort würde
    // das stündliche Schließen + Neu-Anlegen nur unnötig arbeiten und bei
    // Fehlern temporär Trigger verlieren.
    if (schedulerStatus().mode !== "in-tab") return;
    rearmAll().catch((err) => {
      console.error("[notifications] Periodisches Re-Arm fehlgeschlagen:", err);
    });
  }, REARM_INTERVAL_MS);

  rearmAll().catch((err) => {
    console.error("[notifications] Initiales Re-Arm fehlgeschlagen:", err);
  });
  return stopScheduler;
}

export function stopScheduler(): void {
  if (!started) return;
  unsubscribe?.();
  unsubscribe = null;
  if (rearmInterval !== null) {
    clearInterval(rearmInterval);
    rearmInterval = null;
  }
  clearAllInTabTimers();
  started = false;
}

async function handleMessage(message: BroadcastMessage): Promise<void> {
  if (message.type === "reminder-changed") {
    await syncReminder(message.id);
    return;
  }
  // A snooze (or a completion that cancels one) arrives as an event —
  // re-arm so the snoozed notification actually comes back.
  if (message.type === "event-added") {
    await syncReminder(message.reminderId);
    return;
  }
  if (message.type === "reminder-deleted") {
    await clearReminder(message.id);
    return;
  }
  if (message.type === "db-cleared") {
    clearAllInTabTimers();
    const registration = await getRegistration();
    if (registration) {
      await clearAllTriggers(registration);
    }
    // After a wipe (Import-Replace), arm whatever now lives in the DB.
    await rearmAll();
  }
}

export async function showTestNotification(delayMs = 10_000): Promise<boolean> {
  const status = schedulerStatus();
  if (status.mode === "unsupported" || !status.hasPermission) return false;
  const registration = await getRegistration();
  const fireAt = Date.now() + delayMs;

  if (status.mode === "triggers" && registration && supportsNotificationTriggers()) {
    const TimestampTriggerCtor = (
      globalThis as unknown as {
        TimestampTrigger?: new (timestamp: number) => object;
      }
    ).TimestampTrigger;
    if (TimestampTriggerCtor) {
      await registration.showNotification("ErinnerMich – Test", {
        tag: "test-notification",
        body: `Diese Test-Benachrichtigung wurde in ~${Math.round(delayMs / 1000)}s ausgelöst.`,
        ...({ showTrigger: new TimestampTriggerCtor(fireAt) } as Record<string, unknown>),
      });
      return true;
    }
  }

  setTimeout(() => {
    try {
      if (registration) {
        registration
          .showNotification("ErinnerMich – Test", {
            tag: "test-notification",
            body: "Diese Test-Benachrichtigung wurde aus dem offenen Tab ausgelöst.",
          })
          .catch((err) => {
            console.error("[notifications] Test-Notification fehlgeschlagen:", err);
          });
      } else if (typeof Notification !== "undefined") {
        new Notification("ErinnerMich – Test", {
          tag: "test-notification",
          body: "Diese Test-Benachrichtigung wurde aus dem offenen Tab ausgelöst.",
        });
      }
    } catch (err) {
      console.error("[notifications] Test-Notification fehlgeschlagen:", err);
    }
  }, delayMs);
  return true;
}

export function _resetSchedulerForTests(): void {
  queues.clear();
  unsubscribe?.();
  unsubscribe = null;
  if (rearmInterval !== null) {
    clearInterval(rearmInterval);
    rearmInterval = null;
  }
  started = false;
  clearAllInTabTimers();
}
