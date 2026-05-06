import { useCallback, useEffect, useState } from 'react'
import type { ToolEntry, ToolKey } from '../types'
import { listToolEntries } from '../db/toolEntries'
import { subscribe } from '../db/broadcast'

export function useToolEntries(options?: {
  toolKey?: ToolKey
  since?: number
  until?: number
}): { entries: ToolEntry[]; loading: boolean; reload: () => Promise<void> } {
  const toolKey = options?.toolKey
  const since = options?.since
  const until = options?.until
  const [entries, setEntries] = useState<ToolEntry[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const data = await listToolEntries({ toolKey, since, until })
    setEntries(data)
    setLoading(false)
  }, [toolKey, since, until])

  useEffect(() => {
    void reload()
    const unsubscribe = subscribe((message) => {
      if (
        message.type === 'tool-added' ||
        message.type === 'tool-deleted' ||
        message.type === 'db-cleared'
      ) {
        void reload()
      }
    })
    return unsubscribe
  }, [reload])

  return { entries, loading, reload }
}
