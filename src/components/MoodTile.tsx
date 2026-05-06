import { useCallback, useState } from 'react'
import { Smile } from 'lucide-react'
import { useDailyMoodAverage } from '../lib/hooks/useMoodEntries'
import { dayKey } from '../lib/db'
import { useMoodLog } from './MoodLog/MoodLogProvider'
import { addMoodEntry } from '../lib/db/moodEntries'
import { useToast } from './ui/Toast'
import { vibrate } from './ui/Haptic'
import type { MoodValue } from '../lib/types'

const MOOD_EMOJI: Record<MoodValue, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

export function MoodTile() {
  const [today] = useState(() => dayKey(Date.now()))
  const { avgMood, count } = useDailyMoodAverage(today)
  const { open } = useMoodLog()
  const toast = useToast()

  const quickLog = useCallback(
    async (value: MoodValue) => {
      const loggedAt = Date.now()
      await addMoodEntry({ loggedAt, mood: value })
      vibrate('success')
      toast.show({ variant: 'success', message: 'Mood gespeichert' })
    },
    [toast],
  )

  if (count > 0) {
    const rounded = Math.round(avgMood) as MoodValue
    return (
      <button
        type="button"
        onClick={open}
        className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-brand-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-700"
      >
        <span className="text-3xl" aria-hidden>
          {MOOD_EMOJI[rounded]}
        </span>
        <div className="flex flex-1 flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Stimmung heute
          </span>
          <span className="text-sm">
            <span className="tabular-nums font-medium">
              {avgMood.toFixed(1)}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {' '}
              · {count} Eintrag{count === 1 ? '' : 'e'}
            </span>
          </span>
        </div>
        <span className="text-xs text-brand-600 dark:text-brand-400">
          Aktualisieren
        </span>
      </button>
    )
  }

  return (
    <section
      aria-label="Stimmung loggen"
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="flex items-center gap-2">
        <Smile size={16} className="text-brand-600" />
        <span className="text-sm font-medium">
          Wie geht's dir gerade?
        </span>
      </header>
      <div className="flex justify-between gap-1">
        {([1, 2, 3, 4, 5] as MoodValue[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              void quickLog(v)
            }}
            aria-label={`Mood ${v}`}
            className="flex flex-1 items-center justify-center rounded-lg border border-transparent py-2 text-2xl hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-brand-950/40"
          >
            {MOOD_EMOJI[v]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={open}
        className="self-start text-xs text-brand-600 hover:underline dark:text-brand-400"
      >
        Mit Tags + Notiz loggen
      </button>
    </section>
  )
}
