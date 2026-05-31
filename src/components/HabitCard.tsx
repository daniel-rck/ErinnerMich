import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { categoryClasses } from "../lib/categoryColors";
import { addEvent } from "../lib/db/events";
import { useDailyProgress, useEvents } from "../lib/hooks/useEvents";
import { dayKeyAddDays, dayKeyForDate } from "../lib/stats/dayKey";
import { isMilestone } from "../lib/stats/streakMilestones";
import { currentStreak, currentStreakWithFreeze, successfulDayKeys } from "../lib/stats/streaks";
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

  async function bump(value: number, action: "completed" | "progress") {
    const now = Date.now();
    if (action === "completed") {
      const todayKey = dayKeyForDate(new Date(now));
      const wasTodayDone = successfulDayKeys(events).has(todayKey);
      const streakBefore = currentStreak(events, new Date(now));
      await addEvent({
        reminderId: reminder.id,
        action: "completed",
        triggeredAt: now,
      });
      const newStreak = wasTodayDone ? streakBefore : streakBefore + 1;
      if (!wasTodayDone && isMilestone(newStreak)) {
        vibrate("milestone");
        setCelebrateStreak(newStreak);
      } else {
        vibrate("success");
      }
    } else {
      await addEvent({
        reminderId: reminder.id,
        action: "progress",
        triggeredAt: now,
        progress: { value, unit: unit ?? "" },
      });
      vibrate("tick");
    }
  }

  const tone = categoryClasses(reminder.category);

  return (
    <article
      className={`relative flex flex-col gap-3 rounded-xl border border-l-4 ${tone.borderL} border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900`}
    >
      {streak > 0 && (
        <div
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          aria-label={`Streak ${streak} Tage${freezesUsed > 0 ? `, davon ${freezesUsed} Freezes` : ""}`}
        >
          <Flame size={12} />
          <span className="tabular-nums">{streak} d</span>
          {freezesUsed > 0 && <span className="text-[10px] opacity-80">❄{freezesUsed}</span>}
        </div>
      )}

      <header className="flex items-start gap-3 pr-12">
        <ProgressRing ratio={ratio} icon={reminder.icon} ringClass={tone.ring} />
        <div className="flex flex-1 flex-col gap-1.5">
          <h3 className="font-medium leading-tight">{reminder.title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {target !== undefined
              ? `${current} / ${target} ${unit ?? ""}`.trim()
              : current > 0
                ? "Heute erledigt"
                : "Noch nicht heute"}
          </p>
          <Last7Strip days={last7} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {goal?.type === "binary" && (
          <button
            type="button"
            onClick={() => bump(1, "completed")}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            disabled={completions > 0}
          >
            {completions > 0 ? "Erledigt" : "Erledigt markieren"}
          </button>
        )}
        {goal?.type === "count" && (
          <>
            <button
              type="button"
              onClick={() => bump(1, "progress")}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              +1 {goal.unit}
            </button>
            <button
              type="button"
              onClick={() => bump(5, "progress")}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              +5
            </button>
          </>
        )}
        {goal?.type === "duration" && (
          <>
            <button
              type="button"
              onClick={() => bump(15, "progress")}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              +15 min
            </button>
            <button
              type="button"
              onClick={() => bump(5, "progress")}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
            (d.done ? "bg-brand-500 dark:bg-brand-400" : "bg-zinc-200 dark:bg-zinc-800")
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
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeLinecap="round"
          className={ringClass ?? "stroke-brand-500"}
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
