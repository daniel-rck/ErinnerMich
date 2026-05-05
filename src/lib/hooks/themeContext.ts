import { createContext } from 'react'
import type { Theme } from '../db/settings'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (next: Theme) => void
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
