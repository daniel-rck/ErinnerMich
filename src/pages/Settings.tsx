import { useTheme } from '../lib/hooks/useTheme'
import { readSettings, writeLandingTab, type LandingTab } from '../lib/db/settings'
import { useState } from 'react'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [landing, setLanding] = useState<LandingTab>(
    () => readSettings().defaultLandingTab,
  )

  function pickLanding(next: LandingTab) {
    setLanding(next)
    writeLandingTab(next)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Erscheinungsbild
        </h2>
        <div className="flex gap-2">
          <ChoiceButton
            active={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            Hell
          </ChoiceButton>
          <ChoiceButton
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            Dunkel
          </ChoiceButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Standard-Startseite
        </h2>
        <div className="flex flex-wrap gap-2">
          <ChoiceButton active={landing === 'today'} onClick={() => pickLanding('today')}>
            Heute
          </ChoiceButton>
          <ChoiceButton active={landing === 'habits'} onClick={() => pickLanding('habits')}>
            Habits
          </ChoiceButton>
          <ChoiceButton active={landing === 'mood'} onClick={() => pickLanding('mood')}>
            Mood
          </ChoiceButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
          Datenschutz
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Alle Daten bleiben ausschließlich in deinem Browser (IndexedDB +
          localStorage). Es gibt keine Cookies, kein Analytics, keine
          Tracker. DSGVO-konform per Default.
        </p>
      </section>
    </div>
  )
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-md border px-3 py-1.5 text-sm ' +
        (active
          ? 'border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
          : 'border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800')
      }
    >
      {children}
    </button>
  )
}
