import { createContext } from 'react'

export interface MoodLogController {
  open: () => void
  close: () => void
  isOpen: boolean
}

export const MoodLogContext = createContext<MoodLogController | null>(null)
