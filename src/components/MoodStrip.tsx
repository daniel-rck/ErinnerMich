import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useDailyMoodAverage } from '../lib/hooks/useMoodEntries'
import { dayKey } from '../lib/db'
import { useMoodLog } from './MoodLog/MoodLogProvider'
import { addMoodEntry } from '../lib/db/moodEntries'
import { useToast } from './ui/Toast'
import { Chip } from './ui/Chip'
import { vibrate } from './ui/Haptic'
import type { MoodValue } from '../lib/types'

const MOOD_EMOJI: Record<MoodValue, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

const MOOD_LABEL: Record<MoodValue, string> = {
  1: 'sehr schlecht',
  2: 'schlecht',
  3: 'mittel',
  4: 'gut',
  5: 'sehr gut',
}

interface MoodStripProps {
  /**
   * When true, the strip stays visible even after logging today's mood.
   * Default: collapse into an average chip after first log of the day.
   */
  alwaysExpanded?: boolean
}

/**
 * Always-visible mood-log strip — 5 emoji tap targets at 48px each. After
 * the first log of the day it collapses into a chip showing the average,
 * tappable to expand and add another entry.
 */
export function MoodStrip({ alwaysExpanded = false }: MoodStripProps) {
  const [today] = useState(() => dayKey(Date.now()))
  const { avgMood, count, loading } = useDailyMoodAverage(today)
  const { open } = useMoodLog()
  const toast = useToast()
  const [forceExpand, setForceExpand] = useState(false)
  const [pulse, setPulse] = useState<MoodValue | null>(null)

  const quickLog = useCallback(
    async (value: MoodValue) => {
      setPulse(value)
      await addMoodEntry({ loggedAt: Date.now(), mood: value })
      vibrate('success')
      toast.show({ variant: 'success', message: 'Mood gespeichert' })
      setTimeout(() => setPulse(null), 300)
      setForceExpand(false)
    },
    [toast],
  )

  if (loading) {
    return <div className="h-14" aria-hidden />
  }

  const collapsed = count > 0 && !alwaysExpanded && !forceExpand
  if (collapsed) {
    const rounded = Math.round(avgMood) as MoodValue
    return (
      <Chip
        category="mood"
        size="md"
        leadingIcon={<span aria-hidden>{MOOD_EMOJI[rounded]}</span>}
        onClick={() => setForceExpand(true)}
        className="self-start"
      >
        Stimmung heute&nbsp;
        <span className="font-semibold tabular-nums">{avgMood.toFixed(1)}</span>
        <span className="ml-1 opacity-70">· {count}×</span>
      </Chip>
    )
  }

  return (
    <section
      aria-label="Stimmung loggen"
      className="flex flex-col gap-[var(--space-xs)]"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-text-secondary)]">
          Wie geht's dir gerade?
        </h3>
        <button
          type="button"
          onClick={open}
          className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-brand-600)] hover:underline no-min-tap"
        >
          Mit Notiz loggen
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        {([1, 2, 3, 4, 5] as MoodValue[]).map((v) => (
          <motion.button
            key={v}
            type="button"
            onClick={() => {
              void quickLog(v)
            }}
            aria-label={`Stimmung ${v} — ${MOOD_LABEL[v]}`}
            animate={pulse === v ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={pulse === v ? { duration: 0.3, ease: 'easeOut' } : { duration: 0.12 }}
            whileTap={{ scale: 0.92 }}
            className={[
              'flex h-12 flex-1 items-center justify-center',
              'rounded-[var(--radius-md)]',
              'bg-[color:var(--color-surface-elevated)]',
              'border border-[color:var(--color-border-subtle)]',
              'text-3xl',
              'shadow-[var(--elev-1)]',
              'transition-colors duration-[var(--motion-fast)]',
              'hover:border-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)]',
            ].join(' ')}
          >
            <span aria-hidden>{MOOD_EMOJI[v]}</span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
