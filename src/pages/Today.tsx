import { useNavigate } from 'react-router-dom'
import { useReminders } from '../lib/hooks/useReminders'
import { deleteReminder } from '../lib/db/reminders'
import { TodayTimeline } from '../components/TodayTimeline'
import { TodayHero } from '../components/TodayHero'
import { AttentionStrip } from '../components/AttentionStrip'
import { QuickCapture } from '../components/QuickCapture'
import type { Reminder } from '../lib/types'

export function TodayPage() {
  const navigate = useNavigate()
  const { reminders, loading } = useReminders({
    kind: 'reminder',
    activeOnly: true,
  })

  async function handleDelete(reminder: Reminder) {
    if (!confirm(`„${reminder.title}“ wirklich löschen?`)) return
    await deleteReminder(reminder.id)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Heute</h1>
        <button
          type="button"
          onClick={() => navigate('/new?kind=reminder')}
          className="hidden rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 sm:inline-flex"
        >
          + Neu
        </button>
      </header>

      <TodayHero />
      <QuickCapture />
      <AttentionStrip />

      {loading ? (
        <p className="text-sm text-zinc-500">Lade …</p>
      ) : (
        <TodayTimeline
          reminders={reminders}
          onEdit={(r) => navigate(`/edit/${r.id}`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
