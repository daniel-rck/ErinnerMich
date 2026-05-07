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
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 p-4 transition-shadow hover:shadow-md dark:from-violet-950/40 dark:to-pink-950/40"
    >
      <Sparkles size={20} className="shrink-0 text-violet-700 dark:text-violet-200" />
      <p className="text-sm font-medium leading-snug text-violet-950 dark:text-violet-50">
        „{today.text}"
      </p>
    </Link>
  )
}
