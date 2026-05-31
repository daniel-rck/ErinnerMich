import { listExpiresTriggers } from "../schedule/expiresEngine";
import { nextNOccurrences } from "../schedule/nextOccurrence";
import type { Reminder } from "../types";
import { buildDescriptor } from "./actions";

const FUTURE_OCCURRENCE_LIMIT = 5;

interface ShowTriggerOptions extends NotificationOptions {
  showTrigger?: object;
  actions?: ReadonlyArray<{ action: string; title: string }>;
}

interface GetNotificationsOptions {
  tag?: string;
  includeTriggered?: boolean;
}

interface NotificationConstructor {
  new (title: string, options?: NotificationOptions): Notification;
}

interface TimestampTriggerCtor {
  new (timestamp: number): object;
}

declare const TimestampTrigger: TimestampTriggerCtor | undefined;

/**
 * The Notification Triggers API requires both `TimestampTrigger` *and*
 * `showTrigger` support inside `Notification`'s supported options.
 */
export function supportsNotificationTriggers(): boolean {
  if (typeof self === "undefined") return false;
  if (typeof TimestampTrigger === "undefined") return false;
  const ctor = (globalThis as unknown as { Notification?: NotificationConstructor }).Notification;
  if (!ctor) return false;
  const supportedOptions = (ctor as unknown as { supportedOptions?: () => string[] })
    .supportedOptions;
  if (typeof supportedOptions !== "function") return false;
  try {
    return supportedOptions.call(ctor).includes("showTrigger");
  } catch {
    return false;
  }
}

export interface PlannedTrigger {
  reminder: Reminder;
  scheduledFor: Date;
}

/**
 * Returns up to `limit` upcoming triggers for a reminder. For `expires`
 * schedules we expand to *all* PreWarning timestamps (capped) so the engine
 * can arm them in advance.
 */
export function planTriggers(
  reminder: Reminder,
  from: Date = new Date(),
  limit = FUTURE_OCCURRENCE_LIMIT,
): PlannedTrigger[] {
  if (!reminder.active) return [];
  if (reminder.schedule.type === "inventory_based") return [];
  if (reminder.schedule.type === "expires") {
    return listExpiresTriggers(reminder.schedule, from)
      .slice(0, limit)
      .map((scheduledFor) => ({ reminder, scheduledFor }));
  }
  return nextNOccurrences(reminder.schedule, from, limit).map((scheduledFor) => ({
    reminder,
    scheduledFor,
  }));
}

export async function armReminderTriggers(
  registration: ServiceWorkerRegistration,
  reminder: Reminder,
  from: Date = new Date(),
): Promise<number> {
  if (!supportsNotificationTriggers()) return 0;
  await clearReminderTriggers(registration, reminder.id);

  const planned = planTriggers(reminder, from);
  for (const { scheduledFor } of planned) {
    const descriptor = buildDescriptor(reminder, scheduledFor);
    const options: ShowTriggerOptions = {
      tag: descriptor.tag,
      body: descriptor.body,
      icon: descriptor.icon,
      data: descriptor.data,
      actions: descriptor.actions,
      showTrigger: new (TimestampTrigger as TimestampTriggerCtor)(scheduledFor.getTime()),
    };
    await registration.showNotification(descriptor.title, options);
  }
  return planned.length;
}

export async function clearReminderTriggers(
  registration: ServiceWorkerRegistration,
  reminderId: string,
): Promise<void> {
  const all = await getRegisteredNotifications(registration);
  for (const n of all) {
    if (n.tag.startsWith(`reminder-${reminderId}-`)) {
      n.close();
    }
  }
}

/**
 * Closes every reminder-tagged notification, including ones armed via the
 * Triggers API that haven't fired yet. Used on `db-cleared` / Import-Replace.
 */
export async function clearAllTriggers(registration: ServiceWorkerRegistration): Promise<void> {
  const all = await getRegisteredNotifications(registration);
  for (const n of all) {
    if (n.tag.startsWith("reminder-")) {
      n.close();
    }
  }
}

async function getRegisteredNotifications(
  registration: ServiceWorkerRegistration,
): Promise<Notification[]> {
  const opts: GetNotificationsOptions = { includeTriggered: true };
  return (
    registration as unknown as {
      getNotifications: (opts?: GetNotificationsOptions) => Promise<Notification[]>;
    }
  ).getNotifications(opts);
}
