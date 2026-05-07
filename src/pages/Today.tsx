import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useReminders } from '../lib/hooks/useReminders'
import {
  archiveReminder,
  deleteReminder,
  restoreReminder,
} from '../lib/db/reminders'
import { TodayTimeline } from '../components/TodayTimeline'
import { TodayHero } from '../components/TodayHero'
import { AttentionStrip } from '../components/AttentionStrip'
import { QuickCapture } from '../components/QuickCapture'
import { MoodTile } from '../components/MoodTile'
import { useMoodLog } from '../components/MoodLog/MoodLogProvider'
import { useToast } from '../components/ui/Toast'
import { CardSkeleton } from '../components/ui/CardSkeleton'
import { EmergencyButton } from '../components/EmergencyButton'
import { TodayAffirmation } from '../components/TodayAffirmation'
import { useSettings } from '../lib/hooks/useSettings'
import type { Reminder } from '../lib/types'

const DELETE_GRACE_MS = 5500

export function TodayPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const moodLog = useMoodLog()
  const settings = useSettings()
  const [params, setParams] = useSearchParams()
  const { reminders, loading } = useReminders({
    kind: 'reminder',
    activeOnly: true,
  })

  useEffect(() => {
    if (params.get('mood') === 'open') {
      moodLog.open()
      const np = new URLSearchParams(params)
      np.delete('mood')
      setParams(np, { replace: true })
    }
  }, [params, setParams, moodLog])

  async function handleDelete(reminder: Reminder) {
    await archiveReminder(reminder.id)
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      void deleteReminder(reminder.id)
    }, DELETE_GRACE_MS)
    toast.show({
      variant: 'success',
      message: `„${reminder.title}“ gelöscht`,
      durationMs: DELETE_GRACE_MS,
      action: {
        label: 'Rückgängig',
        onClick: () => {
          cancelled = true
          clearTimeout(timer)
          void restoreReminder(reminder.id)
        },
      },
    })
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
      {settings.wellnessToolsEnabled && <TodayAffirmation />}
      <MoodTile />
      <AttentionStrip />

      {loading ? (
        <CardSkeleton count={2} />
      ) : (
        <TodayTimeline
          reminders={reminders}
          onEdit={(r) => navigate(`/edit/${r.id}`)}
          onDelete={handleDelete}
        />
      )}

      {settings.wellnessToolsEnabled && <EmergencyButton />}
    </div>
  )
}
