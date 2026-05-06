import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { TOOL_BY_KEY } from '../lib/tools/registry'
import type { ToolKey } from '../lib/types'

const QUICK_KEYS: ToolKey[] = ['breathing', 'grounding', 'affirmation']

export function EmergencyButton() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Wellness-Tools öffnen"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-30 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-rose-700 sm:bottom-6"
      >
        <LifeBuoy size={18} />
        Gerade nicht gut?
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Was brauchst du gerade?"
      >
        <ul className="flex flex-col gap-2 pb-4">
          {QUICK_KEYS.map((key) => {
            const tool = TOOL_BY_KEY[key]
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    navigate(`/tools/${key}`)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left hover:border-rose-400 hover:bg-rose-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-rose-500 dark:hover:bg-rose-950/30"
                >
                  <span className="text-2xl" aria-hidden>
                    {tool.icon}
                  </span>
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium">{tool.title}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {tool.blurb}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>
    </>
  )
}
