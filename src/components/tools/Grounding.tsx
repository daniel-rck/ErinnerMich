import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Hand, Ear, FlaskConical, UtensilsCrossed, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { addToolEntry } from '../../lib/db/toolEntries'
import { useToast } from '../ui/Toast'

interface Step {
  count: number
  icon: typeof Eye
  prompt: string
  hint: string
}

const STEPS: Step[] = [
  {
    count: 5,
    icon: Eye,
    prompt: '5 Dinge, die du siehst',
    hint: 'Schau dich um — Möbel, Farben, Licht, kleine Details.',
  },
  {
    count: 4,
    icon: Hand,
    prompt: '4 Dinge, die du fühlst',
    hint: 'Fußboden, Stoff der Kleidung, Temperatur, Atem.',
  },
  {
    count: 3,
    icon: Ear,
    prompt: '3 Geräusche, die du hörst',
    hint: 'Verkehr, Atmung, Lüftung, Vögel.',
  },
  {
    count: 2,
    icon: FlaskConical,
    prompt: '2 Dinge, die du riechst',
    hint: 'Kaffee, frische Luft, Seife — oder atme bewusst durch die Nase.',
  },
  {
    count: 1,
    icon: UtensilsCrossed,
    prompt: '1 Ding, das du schmeckst',
    hint: 'Mund, Zahnpasta, ein Schluck Wasser.',
  },
]

export function Grounding() {
  const [stepIndex, setStepIndex] = useState(0)
  const [inputs, setInputs] = useState<string[][]>(() =>
    STEPS.map((s) => Array.from({ length: s.count }, () => '')),
  )
  const startRef = useRef<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    startRef.current = Date.now()
  }, [])

  const step = STEPS[stepIndex]
  const StepIcon = step.icon
  const isLast = stepIndex === STEPS.length - 1

  function updateInput(i: number, value: string) {
    setInputs((prev) => {
      const next = prev.map((arr) => arr.slice())
      next[stepIndex][i] = value
      return next
    })
  }

  async function finish() {
    const start = startRef.current ?? Date.now()
    const durationSec = Math.round((Date.now() - start) / 1000)
    const text = STEPS.map((s, i) => {
      const filled = inputs[i].filter((v) => v.trim().length > 0)
      return filled.length ? `${s.prompt}: ${filled.join(', ')}` : null
    })
      .filter((line): line is string => Boolean(line))
      .join('\n')
    await addToolEntry({
      toolKey: 'grounding',
      loggedAt: Date.now(),
      durationSec,
      text: text || undefined,
    })
    toast.show({
      variant: 'success',
      message: 'Erdungsübung abgeschlossen.',
    })
    setStepIndex(0)
    setInputs(STEPS.map((s) => Array.from({ length: s.count }, () => '')))
    startRef.current = null
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        aria-label={`Schritt ${stepIndex + 1} von ${STEPS.length}`}
        className="flex items-center gap-1.5"
      >
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={
              'h-1.5 flex-1 rounded-full transition-colors ' +
              (i <= stepIndex
                ? 'bg-emerald-500'
                : 'bg-zinc-200 dark:bg-zinc-800')
            }
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <StepIcon size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{step.prompt}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {step.hint}
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2">
            {Array.from({ length: step.count }).map((_, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-6 text-sm font-medium text-zinc-400">
                  {i + 1}.
                </span>
                <input
                  type="text"
                  value={inputs[stepIndex][i] ?? ''}
                  onChange={(e) => updateInput(i, e.target.value)}
                  placeholder="optional"
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <ChevronLeft size={16} /> Zurück
        </button>
        {!isLast ? (
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Weiter <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void finish()}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Check size={16} /> Abschließen
          </button>
        )}
      </div>
    </div>
  )
}
