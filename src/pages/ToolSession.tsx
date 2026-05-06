import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useSettings } from '../lib/hooks/useSettings'
import { TOOL_BY_KEY } from '../lib/tools/registry'
import type { ToolKey } from '../lib/types'
import { BreathingBubble } from '../components/tools/BreathingBubble'
import { Grounding } from '../components/tools/Grounding'
import { GratitudeJar } from '../components/tools/GratitudeJar'
import { TreasureBox } from '../components/tools/TreasureBox'
import { WorryBox } from '../components/tools/WorryBox'
import { Affirmation } from '../components/tools/Affirmation'

const COMPONENTS: Record<ToolKey, () => React.ReactElement> = {
  breathing: BreathingBubble,
  grounding: Grounding,
  gratitude: GratitudeJar,
  treasure: TreasureBox,
  worry: WorryBox,
  affirmation: Affirmation,
}

export function ToolSessionPage() {
  const { wellnessToolsEnabled } = useSettings()
  const { toolKey } = useParams<{ toolKey: string }>()

  if (!wellnessToolsEnabled) return <Navigate to="/" replace />

  const def = toolKey ? TOOL_BY_KEY[toolKey as ToolKey] : undefined
  if (!def) return <Navigate to="/tools" replace />

  const Component = COMPONENTS[def.key]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link
          to="/tools"
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          aria-label="Zurück zur Übersicht"
        >
          <ChevronLeft size={16} /> Tools
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span aria-hidden>{def.icon}</span>
          {def.title}
        </h1>
      </header>
      <Component />
    </div>
  )
}
