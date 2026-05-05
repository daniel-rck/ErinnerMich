import { useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { MoodLogContext } from './moodLogContext'
import { MoodLogSheet } from './MoodLogSheet'

export function MoodLogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen])

  return (
    <MoodLogContext.Provider value={value}>
      {children}
      <MoodLogSheet open={isOpen} onClose={close} />
    </MoodLogContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMoodLog() {
  const ctx = useContext(MoodLogContext)
  if (!ctx)
    throw new Error('useMoodLog muss innerhalb von <MoodLogProvider> stehen')
  return ctx
}
