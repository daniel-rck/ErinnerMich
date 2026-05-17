import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Tabs } from '../components/ui/Tabs'
import { useSettings } from '../lib/hooks/useSettings'
import { FADE_UP, STAGGER_CONTAINER } from '../lib/design/motion'
import { HabitsPage } from './Habits'
import { AllPage } from './All'
import { ToolsPage } from './Tools'

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
                <ToolsPage embedded />
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
