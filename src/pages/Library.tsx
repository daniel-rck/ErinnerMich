import { lazy, Suspense, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Tabs } from '../components/ui/Tabs'
import { useSettings } from '../lib/hooks/useSettings'
import { FADE_UP, STAGGER_CONTAINER } from '../lib/design/motion'
import { HabitsPage } from './Habits'
import { AllPage } from './All'

// Lazy so the wellness-tools code (incl. confetti/animations) is split into its
// own chunk and only loaded when the Tools tab is actually opened.
const ToolsPage = lazy(() =>
  import('./Tools').then((m) => ({ default: m.ToolsPage })),
)

function ToolsFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
      Lade …
    </div>
  )
}

type LibraryTab = 'habits' | 'reminders' | 'tools' | 'all'

const TAB_KEYS: LibraryTab[] = ['habits', 'reminders', 'tools', 'all']

export function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const { wellnessToolsEnabled } = useSettings()

  const requested = params.get('tab') as LibraryTab | null
  const active: LibraryTab = useMemo(() => {
    if (requested && TAB_KEYS.includes(requested)) {
      if (requested === 'tools' && !wellnessToolsEnabled) return 'habits'
      return requested
    }
    return 'habits'
  }, [requested, wellnessToolsEnabled])

  function setActive(next: string) {
    const np = new URLSearchParams(params)
    if (next === 'habits') np.delete('tab')
    else np.set('tab', next)
    setParams(np, { replace: true })
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={STAGGER_CONTAINER}
      className="flex flex-col gap-[var(--space-lg)]"
    >
      <motion.header variants={FADE_UP} className="flex flex-col gap-[var(--space-2xs)]">
        <p className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          Bibliothek
        </p>
        <h1 className="text-[length:var(--text-display)] font-semibold leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
          Routinen
        </h1>
      </motion.header>

      <motion.div variants={FADE_UP}>
        <Tabs value={active} onChange={setActive}>
          <Tabs.List ariaLabel="Bibliotheks-Bereiche">
            <Tabs.Trigger value="habits">Habits</Tabs.Trigger>
            <Tabs.Trigger value="reminders">Reminder</Tabs.Trigger>
            {wellnessToolsEnabled && <Tabs.Trigger value="tools">Tools</Tabs.Trigger>}
            <Tabs.Trigger value="all">Alle</Tabs.Trigger>
          </Tabs.List>

          <div className="mt-[var(--space-md)]">
            <Tabs.Panel value="habits">
              <HabitsPage embedded />
            </Tabs.Panel>
            <Tabs.Panel value="reminders">
              <AllPage embedded defaultFilter="reminder" />
            </Tabs.Panel>
            {wellnessToolsEnabled && (
              <Tabs.Panel value="tools">
                <Suspense fallback={<ToolsFallback />}>
                  <ToolsPage embedded />
                </Suspense>
              </Tabs.Panel>
            )}
            <Tabs.Panel value="all">
              <AllPage embedded />
            </Tabs.Panel>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
