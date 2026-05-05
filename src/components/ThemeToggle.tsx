import { useTheme } from '../lib/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      aria-label={
        theme === 'dark'
          ? 'Auf hellen Modus wechseln'
          : 'Auf dunklen Modus wechseln'
      }
    >
      {theme === 'dark' ? 'Hell' : 'Dunkel'}
    </button>
  )
}
