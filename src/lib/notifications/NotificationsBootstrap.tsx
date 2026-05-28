import { useEffect } from 'react'
import { startScheduler, stopScheduler } from './scheduler'
import {
  startInventoryWatcher,
  stopInventoryWatcher,
} from './inventoryWatcher'
import {
  applyNotificationAction,
  consumeUrlNotifAction,
  isNotificationActionMessage,
} from './clientHandler'
import { refreshAppBadge } from './appBadge'
import { subscribe } from '../db/broadcast'

export function NotificationsBootstrap() {
  useEffect(() => {
    startScheduler()
    startInventoryWatcher()
    void refreshAppBadge()

    const unsubscribeBadge = subscribe((message) => {
      if (
        message.type === 'reminder-changed' ||
        message.type === 'reminder-deleted' ||
        message.type === 'event-added' ||
        message.type === 'event-deleted' ||
        message.type === 'inventory-changed' ||
        message.type === 'db-cleared'
      ) {
        void refreshAppBadge()
      }
    })

    const queued = consumeUrlNotifAction()
    if (queued) {
      void applyNotificationAction(queued)
    }

    let unsubscribeSW: (() => void) | null = null
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handler = (event: MessageEvent) => {
        if (!isNotificationActionMessage(event.data)) return
        void applyNotificationAction(event.data)
      }
      navigator.serviceWorker.addEventListener('message', handler)
      unsubscribeSW = () =>
        navigator.serviceWorker.removeEventListener('message', handler)
    }

    return () => {
      unsubscribeBadge()
      unsubscribeSW?.()
      stopScheduler()
      stopInventoryWatcher()
    }
  }, [])

  return null
}
