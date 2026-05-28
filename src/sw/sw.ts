/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface NotificationActionPayload {
  type: 'erinnermich:notification-action'
  action: string
  reminderId: string
  kind: 'reminder' | 'habit' | 'mood'
  scheduledFor: number
  tag: string
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data as
    | { reminderId?: string; kind?: 'reminder' | 'habit' | 'mood'; scheduledFor?: number }
    | undefined
  if (!data?.reminderId || !data?.kind || data.scheduledFor == null) {
    event.waitUntil(focusOrOpen('/'))
    return
  }

  const payload: NotificationActionPayload = {
    type: 'erinnermich:notification-action',
    action: event.action || 'open',
    reminderId: data.reminderId,
    kind: data.kind,
    scheduledFor: data.scheduledFor,
    tag: event.notification.tag,
  }

  event.waitUntil(routeAction(payload))
})

async function routeAction(payload: NotificationActionPayload): Promise<void> {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })

  if (clients.length === 0) {
    const url = `/?notif=${encodeURIComponent(
      `${payload.action}|${payload.reminderId}|${payload.scheduledFor}|${payload.kind}`,
    )}`
    await self.clients.openWindow(url)
    return
  }

  // Deliver the action to exactly ONE client — otherwise every open tab would
  // apply it and we'd write duplicate events (e.g. two `completed`s). Prefer the
  // already-focused tab, falling back to the first one.
  const target = clients.find((c) => c.focused) ?? clients[0]
  target.postMessage(payload)
  if ('focus' in target) {
    try {
      await target.focus()
    } catch {
      // focus may reject if not allowed; ignore
    }
  }
}

async function focusOrOpen(url: string): Promise<void> {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })
  for (const client of clients) {
    if ('focus' in client) {
      try {
        await client.focus()
        return
      } catch {
        // ignore
      }
    }
  }
  await self.clients.openWindow(url)
}
