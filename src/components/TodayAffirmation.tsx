import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { dayKey } from '../lib/db/index'
import { affirmationForDay } from '../lib/tools/affirmations'

export function TodayAffirmation() {
  const [today] = useState(() => affirmationForDay(dayKey(Date.now())))
  return (
    <Link
      to="/tools/affirmation"
      className={[
        'group relative flex items-center gap-3 overflow-hidden',
        'rounded-[var(--radius-lg)] p-[var(--space-md)]',
        'bg-gradient-to-br from-[color:var(--color-accent-mood-soft)] via-[color:var(--color-surface-elevated)] to-[color:var(--color-accent-glow-soft)]',
        'border border-[color:var(--color-border-subtle)]',
        'shadow-[var(--elev-1)]',
        'transition-shadow duration-[var(--motion-base)]',
        'hover:shadow-[var(--elev-2)]',
      ].join(' ')}
    >
      <div
        aria-hidden
        className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[color:var(--color-accent-mood)] to-[color:var(--color-accent-glow)] opacity-20 blur-2xl"
      />
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-elevated)] shadow-[var(--elev-1)]">
        <Sparkles size={18} className="text-[color:var(--color-brand-600)]" aria-hidden />
      </div>
      <p className="relative text-[length:var(--text-body)] font-medium leading-snug text-[color:var(--color-text-primary)]">
        „{today.text}"
      </p>
    </Link>
  )
}
