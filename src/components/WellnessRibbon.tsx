import { ArrowRight, BookHeart, Sparkles, Wind } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMoodEntriesInRange } from "../lib/hooks/useMoodEntries";
import type { MoodEntry } from "../lib/types";

interface Cue {
  to: string;
  title: string;
  blurb: string;
  icon: typeof Wind;
  accent: "mood" | "calm" | "glow";
}

function latestRecent(entries: MoodEntry[], windowMs: number): MoodEntry | null {
  const now = Date.now();
  const recent = entries.filter((e) => now - e.loggedAt <= windowMs);
  if (recent.length === 0) return null;
  return recent.reduce((acc, e) => (e.loggedAt > acc.loggedAt ? e : acc));
}

function chooseCue(latest: MoodEntry | null, hour: number): Cue | null {
  if (!latest) {
    if (hour >= 20) {
      return {
        to: "/tools/gratitude",
        title: "Tag abschließen",
        blurb: "Was war heute schön?",
        icon: BookHeart,
        accent: "glow",
      };
    }
    return null;
  }
  if (latest.mood <= 2) {
    return {
      to: "/tools/breathing",
      title: "Eine Minute atmen",
      blurb: "Geführte Atmung 4-7-8 oder Box.",
      icon: Wind,
      accent: "calm",
    };
  }
  if (latest.mood === 3) {
    return {
      to: "/tools/grounding",
      title: "5-4-3-2-1 Erden",
      blurb: "Erdung über die fünf Sinne.",
      icon: Wind,
      accent: "calm",
    };
  }
  return {
    to: "/tools/treasure",
    title: "Moment festhalten",
    blurb: "Diesen guten Moment in die Schatzkiste.",
    icon: Sparkles,
    accent: "mood",
  };
}

const TWO_HOURS = 2 * 60 * 60 * 1000;

const ACCENT_BG: Record<Cue["accent"], string> = {
  mood: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
  calm: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
  glow: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
};

const ACCENT_ICON: Record<Cue["accent"], string> = {
  mood: "text-[color:var(--color-accent-500)]",
  calm: "text-[color:var(--color-accent-500)]",
  glow: "text-[color:var(--color-accent-500)]",
};

export function WellnessRibbon() {
  const [toMs] = useState(() => Date.now());
  const fromMs = useMemo(() => toMs - 24 * 60 * 60 * 1000, [toMs]);
  const { entries } = useMoodEntriesInRange(fromMs, toMs);
  const [hour] = useState(() => new Date().getHours());
  const cue = useMemo(() => chooseCue(latestRecent(entries, TWO_HOURS), hour), [entries, hour]);

  if (!cue) return null;
  const Icon = cue.icon;

  return (
    <Link
      to={cue.to}
      className={[
        "group flex items-center gap-[1rem]",
        "rounded-[1.25rem] p-[1rem]",
        "bg-gradient-to-br",
        ACCENT_BG[cue.accent],
        "border border-[color:var(--color-border)]",
        "transition-shadow duration-[240ms]",
        "hover:shadow-[0 4px 12px oklch(20% 0.01 285 / 0.08), 0 2px 4px oklch(20% 0.01 285 / 0.04)]",
      ].join(" ")}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface)] shadow-[0 1px 2px oklch(20% 0.01 285 / 0.06), 0 1px 1px oklch(20% 0.01 285 / 0.04)]">
        <Icon size={20} aria-hidden className={ACCENT_ICON[cue.accent]} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[length:0.9375rem] font-semibold text-[color:var(--color-fg)]">
          {cue.title}
        </h3>
        <p className="text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">{cue.blurb}</p>
      </div>
      <ArrowRight
        size={18}
        aria-hidden
        className="shrink-0 text-[color:var(--color-fg-subtle)] transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
