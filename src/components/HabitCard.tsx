import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { categoryClasses } from "../lib/categoryColors";
import { logHabit } from "../lib/habits/logHabit";
import { useDailyProgress, useEvents } from "../lib/hooks/useEvents";
import { dayKeyAddDays, dayKeyForDate } from "../lib/stats/dayKey";
import { currentStreakWithFreeze, successfulDayKeys } from "../lib/stats/streaks";
import type { Reminder, ReminderEvent } from "../lib/types";
import { Celebration } from "./Celebration";
import { vibrate } from "./ui/Haptic";

interface HabitCardProps {
  reminder: Reminder;
  today: string;
}

export function HabitCard({ reminder, today }: HabitCardProps) {
  const { completions, sum } = useDailyProgress(reminder.id, today);
  const { events } = useEvents(reminder.id);
  const goal = reminder.goal;

  const { current, target, unit, ratio } = computeProgress(goal, completions, sum);

  const { length: streak, freezesUsed } = useMemo(() => currentStreakWithFreeze(events), [events]);
  const last7 = useMemo(() => buildLast7(events), [events]);
  const [celebrateStreak, setCelebrateStreak] = useState<number | null>(null);

  const doneToday = useMemo(() => successfulDayKeys(events).has(today), [events, today]);

  async function bump(value: number) {
    const plan = await logHabit(reminder, value);
    if (plan.milestone !== null) {
      vibrate("milestone");
      setCelebrateStreak(plan.milestone);
    } else {
      vibrate(plan.completesDay ? "success" : "tick");
    }
  }

  const tone = categoryClasses(reminder.category);

  return (
    <article
      className={`relative flex flex-col gap-3 rounded-xl border border-l-4 ${tone.borderL} border-border bg-surface p-4`}
    >
      {streak > 0 && (
        <div
          role="img"
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[color:var(--color-warning-soft)] px-2 py-0.5 text-xs font-medium text-warning-fg"
          aria-label={`Serie: ${streak} ${streak === 1 ? "Tag" : "Tage"}${freezesUsed > 0 ? `, davon ${freezesUsed} überbrückt` : ""}`}
        >
          <Flame size={12} aria-hidden />
          <span className="tabular-nums">{streak}</span>
          {freezesUsed > 0 && <span className="text-[10px] opacity-80">❄{freezesUsed}</span>}
        </div>
      )}

      <header className="flex items-start gap-3 pr-12">
        <ProgressRing ratio={ratio} icon={reminder.icon} ringClass={tone.ring} />
        <div className="flex flex-1 flex-col gap-1.5">
          <h3 className="font-medium leading-tight">{reminder.title}</h3>
          <p className="text-xs text-fg-muted">
            {target !== undefined && goal && goal.type !== "binary"
              ? `${current} / ${target} ${unit ?? ""}${doneToday ? " · geschafft" : ""}`.trim()
              : doneToday
                ? "Heute erledigt"
                : "Noch nicht heute"}
          </p>
          <Last7Strip days={last7} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {(!goal || goal.type === "binary") && (
          <button
            type="button"
            onClick={() => void bump(1)}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-fg-on-accent hover:bg-accent-700 disabled:opacity-50"
            disabled={doneToday}
          >
            {doneToday ? "Erledigt" : "Erledigt markieren"}
          </button>
        )}
        {goal?.type === "count" && (
          <>
            <button
              type="button"
              onClick={() => void bump(1)}
              className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-fg-on-accent hover:bg-accent-700"
            >
              +1 {goal.unit}
            </button>
            <button
              type="button"
              onClick={() => void bump(5)}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-sunken"
            >
              +5
            </button>
          </>
        )}
        {goal?.type === "duration" && (
          <>
            <button
              type="button"
              onClick={() => void bump(15)}
              className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-fg-on-accent hover:bg-accent-700"
            >
              +15 min
            </button>
            <button
              type="button"
              onClick={() => void bump(5)}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-sunken"
            >
              +5 min
            </button>
          </>
        )}
      </div>

      <Celebration
        open={celebrateStreak !== null}
        streak={celebrateStreak ?? 0}
        onClose={() => setCelebrateStreak(null)}
      />
    </article>
  );
}

function buildLast7(events: readonly ReminderEvent[]) {
  const successful = successfulDayKeys(events);
  const todayKey = dayKeyForDate(new Date());
  const out: { key: string; done: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = dayKeyAddDays(todayKey, -i);
    out.push({ key, done: successful.has(key) });
  }
  return out;
}

function Last7Strip({ days }: { days: { key: string; done: boolean }[] }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {days.map((d) => (
        <span
          key={d.key}
          className={
            "h-1.5 flex-1 rounded-full " +
            (d.done ? "bg-accent-500 dark:bg-accent-400" : "bg-border")
          }
        />
      ))}
    </div>
  );
}

function computeProgress(
  goal: Reminder["goal"],
  completions: number,
  sum: number,
): { current: number; target?: number; unit?: string; ratio: number } {
  if (!goal) {
    return { current: completions, ratio: completions > 0 ? 1 : 0 };
  }
  if (goal.type === "binary") {
    return { current: completions, target: 1, ratio: completions > 0 ? 1 : 0 };
  }
  if (goal.type === "count") {
    return {
      current: sum,
      target: goal.target,
      unit: goal.unit,
      ratio: Math.min(1, goal.target > 0 ? sum / goal.target : 0),
    };
  }
  return {
    current: sum,
    target: goal.targetMinutes,
    unit: "min",
    ratio: Math.min(1, goal.targetMinutes > 0 ? sum / goal.targetMinutes : 0),
  };
}

function ProgressRing({
  ratio,
  icon,
  ringClass,
}: {
  ratio: number;
  icon: string;
  ringClass?: string;
}) {
  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Decorative: the completion figure is already in the text beside it. */}
      <svg width={size} height={size} className="-rotate-90" role="presentation">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeLinecap="round"
          className={ringClass ?? "stroke-accent-500"}
          initial={false}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-2xl" aria-hidden>
        {icon}
      </span>
    </div>
  );
}
