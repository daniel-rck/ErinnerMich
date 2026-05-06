import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../lib/hooks/useTheme'
import type { Theme } from '../lib/db/settings'

const ORDER: Theme[] = ['system', 'light', 'dark']
const META: Record<
  Theme,
  { icon: typeof Sun; label: string; aria: string }
> = {
  system: {
    icon: Monitor,
    label: 'System',
    aria: 'Modus: System (Auf hellen Modus wechseln)',
  },
  light: {
    icon: Sun,
    label: 'Hell',
    aria: 'Modus: Hell (Auf dunklen Modus wechseln)',
  },
  dark: {
    icon: Moon,
    label: 'Dunkel',
    aria: 'Modus: Dunkel (Auf System-Modus wechseln)',
  },
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const current = META[theme]
  const Icon = current.icon

  function cycle() {
    const idx = ORDER.indexOf(theme)
    setTheme(ORDER[(idx + 1) % ORDER.length])
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={current.aria}
      title={current.aria}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{current.label}</span>
    </button>
  )
}
