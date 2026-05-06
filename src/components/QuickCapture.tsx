import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles } from 'lucide-react'
import { quickParse } from '../lib/schedule/quickParse'
import { createReminder } from '../lib/db/reminders'
import { useToast } from './ui/Toast'
import { vibrate } from './ui/Haptic'

export function QuickCapture() {
  const navigate = useNavigate()
  const toast = useToast()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const trimmed = input.trim()
    if (trimmed.length === 0 || busy) return
    setBusy(true)
    try {
      const parsed = quickParse(trimmed)
      if (!parsed) {
        navigate(`/new?kind=reminder&title=${encodeURIComponent(trimmed)}`)
        toast.show({
          message: 'Konnte Zeit nicht erkennen — bitte ergänze die Details.',
        })
        setInput('')
        return
      }
      const created = await createReminder({
        kind: 'reminder',
        title: parsed.title,
        icon: '⏰',
        category: 'other',
        color: 'brand',
        schedule: parsed.schedule,
        streakSensitive: false,
        active: true,
      })
      vibrate('tick')
      toast.show({
        variant: 'success',
        message: `„${parsed.title}“ angelegt`,
        action: {
          label: 'Bearbeiten',
          onClick: () => navigate(`/edit/${created.id}`),
        },
      })
      setInput('')
    } catch (err) {
      toast.show({
        variant: 'error',
        message: err instanceof Error ? err.message : 'Anlegen fehlgeschlagen',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1 pl-4 shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:ring-brand-950/40"
    >
      <Sparkles
        size={16}
        className="shrink-0 text-zinc-400 dark:text-zinc-500"
        aria-hidden
      />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='Schnell-Eintrag — z.B. „Mama Sonntag 18 Uhr“'
        aria-label="Schnell-Eintrag"
        className="min-w-0 flex-1 bg-transparent py-2 text-sm focus:outline-none"
        disabled={busy}
      />
      <button
        type="submit"
        disabled={busy || input.trim().length === 0}
        aria-label="Anlegen"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
      >
        <Send size={16} />
      </button>
    </form>
  )
}

