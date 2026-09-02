import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronRight, HeartPulse, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { at } from "../lib/at.ts";
import { createReminder } from "../lib/db/reminders";
import {
  readSettings,
  writeNotificationOnboardingDone,
  writeOnboardingCompleted,
  writeWellnessToolsEnabled,
} from "../lib/db/settings";
import { ensureNotificationPermission } from "../lib/notifications/permission";
import { HABIT_TEMPLATES } from "../lib/templates";
import { useToast } from "./ui/Toast";

interface Slide {
  key: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  kind?: "info" | "choice";
}

const SLIDES: Slide[] = [
  {
    key: "welcome",
    icon: <Sparkles size={28} className="text-accent-600" />,
    title: "Willkommen bei ErinnerMich",
    body: "Erinnern. Reflektieren. Durchatmen. Eine sanfte App für Erinnerungen, Habits, Stimmung — und wenn du magst, kleine Wellness-Tools.",
  },
  {
    key: "privacy",
    icon: <Lock size={28} className="text-accent-600" />,
    title: "Deine Daten bleiben bei dir",
    body: "Alles wird ausschließlich lokal in deinem Browser gespeichert. Kein Account, kein Tracking, DSGVO-konform.",
  },
  {
    key: "wellness",
    icon: <HeartPulse size={28} className="text-accent-600" />,
    title: "Wellness-Tools nutzen?",
    body: "Atemübung, 5-4-3-2-1 Erden, Dankbarkeits-Glas, Sorgen-Box, Schatzkiste und Affirmationen — direkt in der App. Kannst du jederzeit in den Einstellungen umstellen.",
    kind: "choice",
  },
  {
    key: "notify",
    icon: <Bell size={28} className="text-accent-600" />,
    title: "Erinnerungen rechtzeitig erhalten",
    body: "Wenn du möchtest, fragen wir gleich nach Benachrichtigungs-Berechtigung. Ohne Erlaubnis arbeitet die App ohne Push.",
  },
];

const STARTER_KEYS = ["water", "steps", "meditate"];

export function Onboarding() {
  const [showOnboarding, setShowOnboarding] = useState(() => !readSettings().onboardingCompleted);
  const [step, setStep] = useState(0);
  const slide = at(SLIDES, step);
  const navigate = useNavigate();
  const toast = useToast();

  if (!showOnboarding) return null;

  function complete() {
    writeOnboardingCompleted(true);
    setShowOnboarding(false);
  }

  async function nextStep() {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
      return;
    }
    if (slide.key === "notify") {
      const result = await ensureNotificationPermission();
      if (result === "granted") writeNotificationOnboardingDone(true);
    }
    setStep(SLIDES.length);
  }

  function chooseWellness(enabled: boolean) {
    writeWellnessToolsEnabled(enabled);
    setStep(step + 1);
  }

  async function pickStarter(templateKey: string) {
    const template = HABIT_TEMPLATES.find((t) => t.key === templateKey);
    if (!template) return;
    await createReminder({
      kind: "habit",
      title: template.title,
      icon: template.icon,
      category: template.category,
      color: template.color,
      schedule: template.defaultSchedule,
      goal: template.defaultGoal,
      streakSensitive: true,
      active: true,
    });
    toast.show({
      variant: "success",
      message: `„${template.title}“ angelegt`,
    });
    complete();
    navigate("/habits");
  }

  const onPicker = step >= SLIDES.length;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="w-full max-w-md rounded-t-3xl bg-surface pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <AnimatePresence mode="wait">
          {!onPicker ? (
            <motion.div
              key={at(SLIDES, step).key}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center gap-4 px-6 pt-8 pb-4 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 dark:bg-accent-900/40">
                {slide.icon}
              </div>
              <h2 id="onboarding-title" className="text-xl font-semibold">
                {slide.title}
              </h2>
              <p className="text-sm text-fg-muted">{slide.body}</p>
              {slide.kind === "choice" && slide.key === "wellness" && (
                <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => chooseWellness(true)}
                    className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-fg-on-accent hover:bg-accent-700"
                  >
                    Ja, aktivieren
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseWellness(false)}
                    className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-sunken"
                  >
                    Später
                  </button>
                </div>
              )}
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
                <p className="text-sm text-fg-muted">
                  Wähle eine Vorlage — du kannst sie jederzeit anpassen.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {HABIT_TEMPLATES.filter((t) => STARTER_KEYS.includes(t.key)).map((t) => (
                  <li key={t.key}>
                    <button
                      type="button"
                      onClick={() => void pickStarter(t.key)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left hover:border-accent-400 hover:bg-accent-50 dark:hover:border-accent-500 dark:hover:bg-accent-900/40"
                    >
                      <span className="text-2xl" aria-hidden>
                        {t.icon}
                      </span>
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">{t.title}</span>
                        {t.description && (
                          <span className="text-xs text-fg-muted">{t.description}</span>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-fg-subtle" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={complete} className="text-sm text-fg-muted hover:text-fg">
            Überspringen
          </button>
          <div className="flex items-center gap-1.5" aria-hidden>
            {SLIDES.map((s, i) => (
              <span
                key={s.key}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (onPicker || i < step
                    ? "w-2 bg-border"
                    : i === step
                      ? "w-6 bg-accent-500"
                      : "w-2 bg-border")
                }
              />
            ))}
          </div>
          {!onPicker ? (
            slide.kind === "choice" ? (
              <span aria-hidden />
            ) : (
              <button
                type="button"
                onClick={() => void nextStep()}
                className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-fg-on-accent hover:bg-accent-700"
              >
                Weiter
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={complete}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-sunken"
            >
              Später
            </button>
          )}
        </footer>
      </motion.div>
    </div>
  );
}
