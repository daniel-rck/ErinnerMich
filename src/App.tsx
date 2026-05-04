import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'erinnermich:theme'

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function App() {
  const [theme, setTheme] = useState<Theme>(() => readInitialTheme())

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">ErinnerMich</h1>
          <button
            type="button"
            onClick={() =>
              setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
            }
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label={
              theme === 'dark'
                ? 'Auf hellen Modus wechseln'
                : 'Auf dunklen Modus wechseln'
            }
          >
            {theme === 'dark' ? 'Hell' : 'Dunkel'}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-medium">Willkommen</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Reminder und Habits, die im Browser bleiben — ohne Account, ohne
            Tracking. Die App wird in Phasen ausgebaut. Aktuell: Phase 0
            (Setup).
          </p>
        </section>

        <section className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Heute-Ansicht, Habit-Dashboard und Notifications folgen in den
          nächsten Phasen.
        </section>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>
            ErinnerMich · Daten werden ausschließlich lokal in deinem Browser
            gespeichert.
          </span>
          <span>Keine Cookies · Kein Tracking · DSGVO-konform</span>
        </div>
      </footer>
    </div>
  )
}

export default App
