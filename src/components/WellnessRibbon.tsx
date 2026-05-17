import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wind, Sparkles, BookHeart, ArrowRight } from 'lucide-react'
import { useMoodEntriesInRange } from '../lib/hooks/useMoodEntries'
import type { MoodEntry } from '../lib/types'

interface Cue {
  to: string
  title: string
  blurb: string
  icon: typeof Wind
  accent: 'mood' | 'calm' | 'glow'
}

function latestRecent(entries: MoodEntry[], windowMs: number): MoodEntry | null {
  const now = Date.now()
  const recent = entries.filter((e) => now - e.loggedAt <= windowMs)
  if (recent.length === 0) return null
  return recent.reduce((acc, e) => (e.loggedAt > acc.loggedAt ? e : acc))
}

function chooseCue(latest: MoodEntry | null, hour: number): Cue | null {
  if (!latest) {
    if (hour >= 20) {
      return {
        to: '/tools/gratitude',
        title: 'Tag abschließen',
        blurb: 'Was war heute schön?',
        icon: BookHeart,
        accent: 'glow',
      }
    }
    return null
  }
  if (latest.mood <= 2) {
    return {
      to: '/tools/breathing',
      title: 'Eine Minute atmen',
      blurb: 'Geführte Atmung 4-7-8 oder Box.',
      icon: Wind,
      accent: 'calm',
    }
  }
  if (latest.mood === 3) {
    return {
      to: '/tools/grounding',
      title: '5-4-3-2-1 Erden',
      blurb: 'Erdung über die fünf Sinne.',
      icon: Wind,
      accent: 'calm',
    }
  }
  return {
    to: '/tools/treasure',
    title: 'Moment festhalten',
    blurb: 'Diesen guten Moment in die Schatzkiste.',
    icon: Sparkles,
    accent: 'mood',
  }
}

const TWO_HOURS = 2 * 60 * 60 * 1000

const ACCENT_BG: Record<Cue['accent'], string> = {
  mood: 'from-[color:var(--color-accent-mood-soft)] to-[color:var(--color-accent-glow-soft)]',
  calm: 'from-[color:var(--color-accent-calm-soft)] to-[color:var(--color-accent-grow-soft)]',
  glow: 'from-[color:var(--color-accent-glow-soft)] to-[color:var(--color-accent-mood-soft)]',
}

const ACCENT_ICON: Record<Cue['accent'], string> = {
  mood: 'text-[color:var(--color-accent-mood)]',
  calm: 'text-[color:var(--color-accent-calm)]',
  glow: 'text-[color:var(--color-accent-glow)]',
}

export function WellnessRibbon() {
  const [toMs] = useState(() => Date.now())
  const fromMs = useMemo(() => toMs - 24 * 60 * 60 * 1000, [toMs])
  const { entries } = useMoodEntriesInRange(fromMs, toMs)
  const [hour] = useState(() => new Date().getHours())
  const cue = useMemo(() => chooseCue(latestRecent(entries, TWO_HOURS), hour), [entries, hour])

  if (!cue) return null
  const Icon = cue.icon

  return (
    <Link
      to={cue.to}
      className={[
        'group flex items-center gap-[var(--space-md)]',
        'rounded-[var(--radius-lg)] p-[var(--space-md)]',
        'bg-gradient-to-br',
        ACCENT_BG[cue.accent],
        'border border-[color:var(--color-border-subtle)]',
        'transition-shadow duration-[var(--motion-base)]',
        'hover:shadow-[var(--elev-2)]',
      ].join(' ')}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-elevated)] shadow-[var(--elev-1)]">
        <Icon size={20} aria-hidden className={ACCENT_ICON[cue.accent]} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[length:var(--text-body)] font-semibold text-[color:var(--color-text-primary)]">
          {cue.title}
        </h3>
        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
          {cue.blurb}
        </p>
      </div>
      <ArrowRight
        size={18}
        aria-hidden
        className="shrink-0 text-[color:var(--color-text-tertiary)] transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}
