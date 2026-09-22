import { motion } from "framer-motion";
import { Check, ChevronRight, Flame, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { habitTarget, logHabit, progressOnDay } from "../lib/habits/logHabit";
import { useAllEvents } from "../lib/hooks/useAllEvents";
import { useNow } from "../lib/hooks/useNow";
import { useReminders } from "../lib/hooks/useReminders";
import { dayKeyForDate } from "../lib/stats/dayKey";
import { currentStreak, successfulDayKeys } from "../lib/stats/streaks";
import type { Reminder, ReminderEvent } from "../lib/types";
import { Celebration } from "./Celebration";
import { vibrate } from "./ui/Haptic";

interface HabitRailProps {
  /** Cap how many habits to render in the rail. Default 6. */
  limit?: number;
}

export function HabitRail({ limit = 6 }: HabitRailProps) {
  const { reminders } = useReminders({ kind: "habit", activeOnly: true });
  const { events } = useAllEvents();
  const now = useNow();
  const today = dayKeyForDate(now);
  const [celebrateStreak, setCelebrateStreak] = useState<number | null>(null);

  const eventsByReminder = useMemo(() => {
    const map = new Map<string, ReminderEvent[]>();
    for (const e of events) {
      const list = map.get(e.reminderId) ?? [];
      list.push(e);
      map.set(e.reminderId, list);
    }
    return map;
  }, [events]);

  const items = useMemo(() => reminders.slice(0, limit), [reminders, limit]);

  async function bump(reminder: Reminder) {
    // Same step as the habit card's primary button, so "+1" on a
    // "8 Glas" habit adds one glass instead of closing out the day.
    const plan = await logHabit(reminder, stepFor(reminder));
    if (plan.milestone !== null) {
      vibrate("milestone");
      setCelebrateStreak(plan.milestone);
    } else {
      vibrate(plan.completesDay ? "success" : "tick");
    }
  }

  if (items.length === 0) return null;

  return (
    <section aria-label="Habits" className="flex flex-col gap-[0.75rem]">
      <header className="flex items-center justify-between">
        <h2 className="text-[length:1rem] font-semibold text-[color:var(--color-fg)]">
          Heutige Habits
        </h2>
        <Link
          to="/library"
          className="inline-flex items-center gap-1 text-[length:0.8125rem] font-medium text-[color:var(--color-accent-600)] hover:underline no-min-tap"
        >
          Alle
          <ChevronRight size={14} aria-hidden />
        </Link>
      </header>
      <ul
        className={[
          "flex gap-[0.75rem] overflow-x-auto",
          "snap-x snap-mandatory",
          "-mx-[1rem] px-[1rem] pb-1",
          "scroll-pl-[1rem]",
        ].join(" ")}
      >
        {items.map((reminder) => {
          const habitEvents = eventsByReminder.get(reminder.id) ?? [];
          const todayDone = successfulDayKeys(habitEvents).has(today);
          const streak = currentStreak(habitEvents, now);
          const target = habitTarget(reminder.goal);
          return (
            <li key={reminder.id} className="snap-start">
              <HabitMiniCard
                reminder={reminder}
                done={todayDone}
                progress={
                  target === null ? null : { sum: progressOnDay(habitEvents, today), target }
                }
                streak={streak}
                onBump={() => void bump(reminder)}
              />
            </li>
          );
        })}
      </ul>

      <Celebration
        open={celebrateStreak != null}
        streak={celebrateStreak ?? 0}
        onClose={() => setCelebrateStreak(null)}
      />
    </section>
  );
}

function stepFor(reminder: Reminder): number {
  return reminder.goal?.type === "duration" ? 15 : 1;
}

function stepLabel(reminder: Reminder): string {
  if (reminder.goal?.type === "count") return `+1 ${reminder.goal.unit}`;
  if (reminder.goal?.type === "duration") return "+15 min";
  return "Abhaken";
}

type HabitMiniCardProps = {
  reminder: Reminder;
  done: boolean;
  progress: { sum: number; target: number } | null;
  streak: number;
  onBump: () => void;
};

function HabitMiniCard({ reminder, done, progress, streak, onBump }: HabitMiniCardProps) {
  // Binary habits are finished for the day once done; count/duration habits
  // may keep logging past the target.
  const locked = done && progress === null;
  return (
    <article
      className={[
        "flex w-36 shrink-0 flex-col items-center gap-2",
        "rounded-[1.25rem] p-[0.75rem]",
        "bg-[color:var(--color-surface)]",
        "border border-[color:var(--color-border)]",
        "shadow-sm",
      ].join(" ")}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-2xl leading-none" aria-hidden>
          {reminder.icon}
        </span>
        {streak > 0 && (
          <span
            role="img"
            className="inline-flex items-center gap-0.5 rounded-full bg-[color:var(--color-warning-soft)] px-1.5 py-0.5 text-[length:0.6875rem] font-medium text-warning-fg"
            aria-label={`Serie: ${streak} ${streak === 1 ? "Tag" : "Tage"}`}
          >
            <Flame size={10} aria-hidden />
            {streak}
          </span>
        )}
      </div>
      <Link
        to={`/detail/${reminder.id}`}
        className="line-clamp-2 w-full text-center text-[length:0.8125rem] font-medium leading-tight text-[color:var(--color-fg)] no-min-tap"
      >
        {reminder.title}
      </Link>
      {progress && (
        <span className="text-[length:0.75rem] tabular-nums text-fg-muted">
          {progress.sum} / {progress.target}
        </span>
      )}
      <motion.button
        type="button"
        onClick={onBump}
        disabled={locked}
        whileTap={locked ? undefined : { scale: 0.92 }}
        aria-label={
          locked ? `${reminder.title}: heute erledigt` : `${reminder.title}: ${stepLabel(reminder)}`
        }
        className={[
          "mt-auto inline-flex items-center justify-center gap-1",
          "h-11 w-full rounded-[0.875rem]",
          "text-[length:0.8125rem] font-medium",
          "transition-colors duration-[140ms]",
          done
            ? "bg-[color:var(--color-success-soft)] text-success-fg"
            : "bg-[color:var(--color-accent-600)] text-fg-on-accent hover:bg-[color:var(--color-accent-700)]",
          locked ? "cursor-default" : "",
        ].join(" ")}
      >
        {locked ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden />}
        {locked ? "Erledigt" : stepLabel(reminder)}
      </motion.button>
    </article>
  );
}
