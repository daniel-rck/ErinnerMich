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

  for (const client of clients) {
    client.postMessage(payload)
  }

  if (clients.length === 0) {
    const url = `/?notif=${encodeURIComponent(
      `${payload.action}|${payload.reminderId}|${payload.scheduledFor}|${payload.kind}`,
    )}`
    await self.clients.openWindow(url)
  } else {
    const target = clients[0]
    if ('focus' in target) {
      try {
        await target.focus()
      } catch {
        // focus may reject if not allowed; ignore
      }
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
