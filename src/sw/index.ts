/// <reference lib="webworker" />
import { registerAppShell } from "./base.ts";

declare const self: ServiceWorkerGlobalScope;

// Precache, offline navigation and prompt-based updates (owned: base.ts). A new
// version no longer activates on install: it waits until the user accepts the
// UpdatePrompt, which posts SKIP_WAITING. The notification handlers below don't
// depend on which version is active — notificationclick goes to whichever
// worker controls the registration.
registerAppShell();

// ── Notifications ──────────────────────────────────────────────────────────
// Notifications are shown from the page (src/lib/notifications/) through this
// registration; a click lands here and is routed to exactly one app tab, or
// opens one with the action encoded in `?notif=` (clientHandler.ts).

type NotificationActionPayload = {
  type: "erinnermich:notification-action";
  action: string;
  reminderId: string;
  kind: "reminder" | "habit" | "mood";
  scheduledFor: number;
  tag: string;
};

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data as
    | { reminderId?: string; kind?: "reminder" | "habit" | "mood"; scheduledFor?: number }
    | undefined;
  if (!data?.reminderId || !data?.kind || data.scheduledFor == null) {
    event.waitUntil(focusOrOpen("/"));
    return;
  }

  const payload: NotificationActionPayload = {
    type: "erinnermich:notification-action",
    action: event.action || "open",
    reminderId: data.reminderId,
    kind: data.kind,
    scheduledFor: data.scheduledFor,
    tag: event.notification.tag,
  };

  event.waitUntil(routeAction(payload));
});

async function routeAction(payload: NotificationActionPayload): Promise<void> {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  const [first] = clients;
  if (!first) {
    const url = `/?notif=${encodeURIComponent(
      `${payload.action}|${payload.reminderId}|${payload.scheduledFor}|${payload.kind}`,
    )}`;
    await self.clients.openWindow(url);
    return;
  }

  // Deliver the action to exactly ONE client — otherwise every open tab would
  // apply it and we'd write duplicate events (e.g. two `completed`s). Prefer the
  // already-focused tab, falling back to the first one.
  const target = clients.find((c) => c.focused) ?? first;
  target.postMessage(payload);
  if ("focus" in target) {
    try {
      await target.focus();
    } catch {
      // focus may reject if not allowed; ignore
    }
  }
}

async function focusOrOpen(url: string): Promise<void> {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) {
    if ("focus" in client) {
      try {
        await client.focus();
        return;
      } catch {
        // ignore
      }
    }
  }
  await self.clients.openWindow(url);
}
