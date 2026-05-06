import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Lock, Sparkles, ChevronRight } from 'lucide-react'
import {
  readSettings,
  writeNotificationOnboardingDone,
  writeOnboardingCompleted,
} from '../lib/db/settings'
import { ensureNotificationPermission } from '../lib/notifications/permission'
import { HABIT_TEMPLATES } from '../lib/templates'
import { createReminder } from '../lib/db/reminders'
import { useToast } from './ui/Toast'

interface Slide {
  key: string
  icon: React.ReactNode
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    icon: <Sparkles size={28} className="text-brand-600" />,
    title: 'Willkommen bei ErinnerMich',
    body: 'Eine sanfte App für Erinnerungen, Habits und Stimmung — alles an einem Ort.',
  },
  {
    key: 'privacy',
    icon: <Lock size={28} className="text-brand-600" />,
    title: 'Deine Daten bleiben bei dir',
    body: 'Alles wird ausschließlich lokal in deinem Browser gespeichert. Kein Account, kein Tracking, DSGVO-konform.',
  },
  {
    key: 'notify',
    icon: <Bell size={28} className="text-brand-600" />,
    title: 'Erinnerungen rechtzeitig erhalten',
    body: 'Wenn du möchtest, fragen wir gleich nach Benachrichtigungs-Berechtigung. Ohne Erlaubnis arbeitet die App ohne Push.',
  },
]

const STARTER_KEYS = ['water', 'steps', 'meditate']

export function Onboarding() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !readSettings().onboardingCompleted,
  )
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const toast = useToast()

  if (!showOnboarding) return null

  function complete() {
    writeOnboardingCompleted(true)
    setShowOnboarding(false)
  }

  async function nextStep() {
    if (step < SLIDES.length - 1) {
      setStep(step + 1)
      return
    }
    if (SLIDES[step].key === 'notify') {
      const result = await ensureNotificationPermission()
      if (result === 'granted') writeNotificationOnboardingDone(true)
    }
    setStep(SLIDES.length)
  }

  async function pickStarter(templateKey: string) {
    const template = HABIT_TEMPLATES.find((t) => t.key === templateKey)
    if (!template) return
    await createReminder({
      kind: 'habit',
      title: template.title,
      icon: template.icon,
      category: template.category,
      color: template.color,
      schedule: template.defaultSchedule,
      goal: template.defaultGoal,
      streakSensitive: true,
      active: true,
    })
    toast.show({
      variant: 'success',
      message: `„${template.title}“ angelegt`,
    })
    complete()
    navigate('/habits')
  }

  const onPicker = step >= SLIDES.length

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="w-full max-w-md rounded-t-3xl bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl dark:bg-zinc-900 sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <AnimatePresence mode="wait">
          {!onPicker ? (
            <motion.div
              key={SLIDES[step].key}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center gap-4 px-6 pt-8 pb-4 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40">
                {SLIDES[step].icon}
              </div>
              <h2 id="onboarding-title" className="text-xl font-semibold">
                {SLIDES[step].title}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {SLIDES[step].body}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="starter"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4 px-6 pt-8 pb-4"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 id="onboarding-title" className="text-xl font-semibold">
                  Erste Habit anlegen?
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Wähle eine Vorlage — du kannst sie jederzeit anpassen.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {HABIT_TEMPLATES.filter((t) =>
                  STARTER_KEYS.includes(t.key),
                ).map((t) => (
                  <li key={t.key}>
                    <button
                      type="button"
                      onClick={() => void pickStarter(t.key)}
                      className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left hover:border-brand-400 hover:bg-brand-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-500 dark:hover:bg-brand-950/40"
                    >
                      <span className="text-2xl" aria-hidden>
                        {t.icon}
                      </span>
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">{t.title}</span>
                        {t.description && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {t.description}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-zinc-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="flex items-center justify-between gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={complete}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Überspringen
          </button>
          <div className="flex items-center gap-1.5" aria-hidden>
            {SLIDES.map((s, i) => (
              <span
                key={s.key}
                className={
                  'h-1.5 rounded-full transition-all ' +
                  (onPicker || i < step
                    ? 'w-2 bg-zinc-300 dark:bg-zinc-700'
                    : i === step
                      ? 'w-6 bg-brand-500'
                      : 'w-2 bg-zinc-300 dark:bg-zinc-700')
                }
              />
            ))}
          </div>
          {!onPicker ? (
            <button
              type="button"
              onClick={() => void nextStep()}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              {step === SLIDES.length - 1 ? 'Weiter' : 'Weiter'}
            </button>
          ) : (
            <button
              type="button"
              onClick={complete}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Später
            </button>
          )}
        </footer>
      </motion.div>
    </div>
  )
}
