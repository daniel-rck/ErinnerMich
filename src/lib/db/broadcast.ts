export const BROADCAST_CHANNEL = 'erinnermich-db'

export type BroadcastMessage =
  | { type: 'reminder-changed'; id: string }
  | { type: 'reminder-deleted'; id: string }
  | { type: 'event-added'; reminderId: string }
  | { type: 'inventory-changed'; reminderId: string }
  | { type: 'mood-added'; id: string }
  | { type: 'mood-deleted'; id: string }
  | { type: 'db-cleared' }

export function broadcast(message: BroadcastMessage): void {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(BROADCAST_CHANNEL)
  channel.postMessage(message)
  channel.close()
}

export function subscribe(
  listener: (message: BroadcastMessage) => void,
): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    return () => {}
  }
  const channel = new BroadcastChannel(BROADCAST_CHANNEL)
  const handler = (event: MessageEvent<BroadcastMessage>) => {
    listener(event.data)
  }
  channel.addEventListener('message', handler)
  return () => {
    channel.removeEventListener('message', handler)
    channel.close()
  }
}
