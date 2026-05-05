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

export function NotificationsBootstrap() {
  useEffect(() => {
    startScheduler()
    startInventoryWatcher()

    const queued = consumeUrlNotifAction()
    if (queued) {
      void applyNotificationAction(queued)
    }

    let unsubscribe: (() => void) | null = null
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handler = (event: MessageEvent) => {
        if (!isNotificationActionMessage(event.data)) return
        void applyNotificationAction(event.data)
      }
      navigator.serviceWorker.addEventListener('message', handler)
      unsubscribe = () =>
        navigator.serviceWorker.removeEventListener('message', handler)
    }

    return () => {
      unsubscribe?.()
      stopScheduler()
      stopInventoryWatcher()
    }
  }, [])

  return null
}
