import { motion } from "framer-motion";
import { CheckCircle2, Clock, Flame } from "lucide-react";
import { useMemo } from "react";
import { useAllEvents } from "../lib/hooks/useAllEvents";
import { useReminders } from "../lib/hooks/useReminders";
import { nextOccurrence } from "../lib/schedule/nextOccurrence";
import { dayKeyForDate } from "../lib/stats/dayKey";
import { streakStats } from "../lib/stats/streaks";
import type { Reminder, ReminderEvent } from "../lib/types";
import { StatTile } from "./ui/StatTile";
import { Surface } from "./ui/Surface";

interface HeroStats {
  dueTotal: number;
  doneTotal: number;
  bestStreak: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function microcopy(ratio: number, due: number): string {
  if (due === 0) return "Heute steht nichts an. Genieße den Tag.";
  if (ratio === 0) return "Bereit, durchzustarten?";
  if (ratio < 0.34) return "Ein guter Anfang.";
  if (ratio < 0.67) return "Halbzeit — du schaffst das.";
  if (ratio < 1) return "Stark, fast durch.";
  return "Alles erledigt. Wow.";
}

function computeStats(
  reminders: Reminder[],
  events: readonly ReminderEvent[],
  now: Date,
): HeroStats {
  const todayKey = dayKeyForDate(now);
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const eventsToday = events.filter((e) => {
    const ts = e.triggeredAt ?? e.scheduledFor;
    return (
      e.action === "completed" && ts != null && ts >= dayStart.getTime() && ts <= dayEnd.getTime()
    );
  });
  const completedReminderIds = new Set(eventsToday.map((e) => e.reminderId));

  let dueTotal = 0;
  let doneTotal = 0;
  for (const r of reminders) {
    if (!r.active) continue;
    if (r.archivedAt != null) continue;
    if (r.kind === "mood") continue;
    let dueToday: boolean;
    if (r.kind === "habit") {
      dueToday = true;
    } else {
      const next = nextOccurrence(r.schedule, dayStart);
      dueToday = next !== null && next.getTime() <= dayEnd.getTime();
    }
    if (!dueToday) continue;
    dueTotal += 1;
    if (completedReminderIds.has(r.id)) doneTotal += 1;
  }

  const eventsByReminder = new Map<string, ReminderEvent[]>();
  for (const e of events) {
    const list = eventsByReminder.get(e.reminderId) ?? [];
    list.push(e);
    eventsByReminder.set(e.reminderId, list);
  }
  let bestStreak = 0;
  for (const r of reminders) {
    if (r.kind !== "habit" || !r.active) continue;
    const habitEvents = eventsByReminder.get(r.id) ?? [];
    const stats = streakStats(habitEvents, now);
    if (stats.current > bestStreak) bestStreak = stats.current;
  }

  void todayKey;
  return { dueTotal, doneTotal, bestStreak };
}

export function TodayHero() {
  const { reminders } = useReminders({ activeOnly: true });
  const { events } = useAllEvents();
  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => computeStats(reminders, events, now), [reminders, events, now]);
  const ratio = stats.dueTotal === 0 ? 0 : Math.min(1, stats.doneTotal / stats.dueTotal);

  return (
    <Surface
      variant="raised"
      radius="xl"
      padding="lg"
      as="section"
      aria-label="Tagesübersicht"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-gradient-to-br from-[color:var(--color-brand-400)] to-[color:var(--color-accent-mood)] opacity-15 blur-3xl"
      />
      <div className="relative flex items-center gap-5">
        <ProgressRing ratio={ratio} done={stats.doneTotal} due={stats.dueTotal} />
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
            {stats.dueTotal === 0 ? "Heute" : `${stats.doneTotal} / ${stats.dueTotal} erledigt`}
          </p>
          <h2 className="text-[length:var(--text-title-1)] font-semibold leading-[var(--leading-title)] tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
            {microcopy(ratio, stats.dueTotal)}
          </h2>
        </div>
      </div>

      <div className="relative mt-[var(--space-lg)] grid grid-cols-3 gap-2">
        <StatTile
          label="Erledigt"
          value={stats.doneTotal}
          icon={CheckCircle2}
          accent="grow"
          size="sm"
        />
        <StatTile
          label="Offen"
          value={Math.max(0, stats.dueTotal - stats.doneTotal)}
          icon={Clock}
          accent="brand"
          size="sm"
        />
        <StatTile
          label="Streak"
          value={`${stats.bestStreak}d`}
          icon={Flame}
          accent="glow"
          size="sm"
        />
      </div>
    </Surface>
  );
}

function ProgressRing({ ratio, done, due }: { ratio: number; done: number; due: number }) {
  const size = 124;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={due === 0 ? 1 : due}
      aria-valuenow={done}
      aria-label={`${done} von ${due} erledigt`}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="hero-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-400)" />
            <stop offset="60%" stopColor="var(--color-brand-600)" />
            <stop offset="100%" stopColor="var(--color-accent-mood)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="var(--color-border-subtle)"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeLinecap="round"
          stroke="url(#hero-ring-gradient)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[length:var(--text-display)] font-semibold leading-none tabular-nums text-[color:var(--color-text-primary)]">
          {done}
        </span>
        <span className="mt-0.5 text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
          / {due}
        </span>
      </div>
    </div>
  );
}
