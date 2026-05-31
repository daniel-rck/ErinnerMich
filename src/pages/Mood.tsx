import { motion } from "framer-motion";
import { ArrowRight, LifeBuoy, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sparkline } from "../components/charts/Sparkline";
import { WeekdayBar } from "../components/charts/WeekdayBar";
import { MoodStrip } from "../components/MoodStrip";
import { TodayAffirmation } from "../components/TodayAffirmation";
import { Card } from "../components/ui/Card";
import { Sheet } from "../components/ui/Sheet";
import { dayKey } from "../lib/db";
import { FADE_UP, STAGGER_CONTAINER } from "../lib/design/motion";
import { useMoodEntriesInRange } from "../lib/hooks/useMoodEntries";
import { useSettings } from "../lib/hooks/useSettings";
import { useToolEntries } from "../lib/hooks/useToolEntries";
import { dailyMoodSeries, moodByWeekday } from "../lib/stats/moodAggregates";
import type { ToolCategory, ToolDef } from "../lib/tools/registry";
import { TOOLS } from "../lib/tools/registry";

const ACCENT_GRADIENT: Record<ToolCategory, string> = {
  acute: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
  reflection: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
};

export function MoodPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const [sosOpen, setSosOpen] = useState(false);

  const [now] = useState(() => Date.now());
  const fromMs = useMemo(() => now - 7 * 24 * 60 * 60 * 1000, [now]);
  const { entries } = useMoodEntriesInRange(fromMs, now);

  const series = useMemo(() => dailyMoodSeries(entries, 7), [entries]);
  const sparklineData = useMemo(
    () => series.map((p) => ({ label: p.day.slice(-5), value: p.avgMood })),
    [series],
  );
  const weekday = useMemo(
    () =>
      moodByWeekday(entries).map((p) => ({
        label: p.label,
        value: p.avgMood,
        count: p.count,
      })),
    [entries],
  );

  if (!settings.wellnessToolsEnabled) return <Navigate to="/" replace />;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={STAGGER_CONTAINER}
      className="flex flex-col gap-[1.5rem]"
    >
      <motion.header variants={FADE_UP} className="flex flex-col gap-[0.25rem]">
        <p className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
          Stimmung &amp; Wellness
        </p>
        <h1 className="text-[length:clamp(2rem,5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[color:var(--color-fg)]">
          Wie geht's dir?
        </h1>
      </motion.header>

      <motion.section variants={FADE_UP}>
        <MoodStrip alwaysExpanded />
      </motion.section>

      <motion.section variants={FADE_UP}>
        <Card variant="raised" radius="lg" padding="md" as="section">
          <div className="mb-[0.75rem] flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-[length:1rem] font-semibold text-[color:var(--color-fg)]">
                7 Tage
              </h2>
              <p className="text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">
                Tagesdurchschnitt deiner Stimmung
              </p>
            </div>
            <Link
              to="/stats"
              aria-label="Zur Stimmungs-Statistik"
              className="inline-flex items-center gap-1 text-[length:0.8125rem] font-medium text-[color:var(--color-accent-600)] hover:underline no-min-tap"
            >
              <TrendingUp size={14} aria-hidden />
              Stats
            </Link>
          </div>
          {entries.length === 0 ? (
            <p className="rounded-[0.875rem] border border-dashed border-[color:var(--color-border)] p-[1rem] text-center text-[length:0.8125rem] text-[color:var(--color-fg-subtle)]">
              Noch keine Einträge. Tippe oben auf einen Smiley.
            </p>
          ) : (
            <div className="flex flex-col gap-[0.75rem]">
              <div className="h-16">
                <Sparkline data={sparklineData} ariaLabel="Stimmung 7 Tage" />
              </div>
              <WeekdayBar data={weekday} ariaLabel="Stimmung nach Wochentag" />
            </div>
          )}
        </Card>
      </motion.section>

      {settings.wellnessToolsEnabled && (
        <>
          <motion.section variants={FADE_UP}>
            <TodayAffirmation />
          </motion.section>

          <motion.section variants={FADE_UP} className="flex flex-col gap-[0.75rem]">
            <header className="flex items-center justify-between">
              <h2 className="text-[length:1.25rem] font-semibold text-[color:var(--color-fg)]">
                Akut
              </h2>
              <span className="text-[length:0.8125rem] text-[color:var(--color-fg-subtle)]">
                Wenn's gerade zu viel ist
              </span>
            </header>
            <div className="grid grid-cols-1 gap-[0.75rem] sm:grid-cols-2">
              {TOOLS.filter((t) => t.category === "acute").map((t) => (
                <ToolCard key={t.key} tool={t} />
              ))}
            </div>
          </motion.section>

          <motion.section variants={FADE_UP} className="flex flex-col gap-[0.75rem]">
            <header className="flex items-center justify-between">
              <h2 className="text-[length:1.25rem] font-semibold text-[color:var(--color-fg)]">
                Reflexion
              </h2>
              <span className="text-[length:0.8125rem] text-[color:var(--color-fg-subtle)]">
                In Ruhe nachspüren
              </span>
            </header>
            <div className="grid grid-cols-1 gap-[0.75rem] sm:grid-cols-2">
              {TOOLS.filter((t) => t.category === "reflection").map((t) => (
                <ToolCard key={t.key} tool={t} />
              ))}
            </div>
          </motion.section>

          <motion.section variants={FADE_UP}>
            <button
              type="button"
              onClick={() => setSosOpen(true)}
              className={[
                "group flex w-full items-center gap-[1rem]",
                "rounded-[1.25rem] p-[1rem]",
                "bg-gradient-to-br from-[color:var(--color-danger-soft)] to-[color:var(--color-accent-100)]",
                "border border-[color:var(--color-danger)]/30",
                "transition-shadow duration-[240ms]",
                "hover:shadow-[0 4px 12px oklch(20% 0.01 285 / 0.08), 0 2px 4px oklch(20% 0.01 285 / 0.04)]",
              ].join(" ")}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface)] shadow-[0 1px 2px oklch(20% 0.01 285 / 0.06), 0 1px 1px oklch(20% 0.01 285 / 0.04)]">
                <LifeBuoy size={20} aria-hidden className="text-[color:var(--color-danger)]" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h3 className="text-[length:0.9375rem] font-semibold text-[color:var(--color-fg)]">
                  Brauchst du gerade Halt?
                </h3>
                <p className="text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">
                  Drei Tools, die sofort helfen können.
                </p>
              </div>
              <ArrowRight
                size={18}
                aria-hidden
                className="shrink-0 text-[color:var(--color-fg-subtle)] transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </motion.section>
        </>
      )}

      <Sheet open={sosOpen} onClose={() => setSosOpen(false)} title="Was brauchst du gerade?">
        <ul className="flex flex-col gap-[0.5rem] pb-[1rem]">
          {TOOLS.filter((t) => t.category === "acute").map((tool) => (
            <li key={tool.key}>
              <button
                type="button"
                onClick={() => {
                  setSosOpen(false);
                  navigate(`/tools/${tool.key}`);
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-[0.875rem] p-[0.75rem] text-left",
                  "bg-[color:var(--color-surface-sunken)]",
                  "hover:bg-[color:var(--color-border)]",
                ].join(" ")}
              >
                <span className="text-2xl" aria-hidden>
                  {tool.icon}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-[color:var(--color-fg)]">{tool.title}</span>
                  <span className="text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">
                    {tool.blurb}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </motion.div>
  );
}

function ToolCard({ tool }: { tool: ToolDef }) {
  const { entries } = useToolEntries({ toolKey: tool.key });
  const [today] = useState(() => dayKey(Date.now()));
  const todayCount = useMemo(
    () => entries.filter((e) => dayKey(e.loggedAt) === today).length,
    [entries, today],
  );
  const totalCount = entries.length;
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Link
        to={`/tools/${tool.key}`}
        className={[
          "flex items-center gap-3 rounded-[1.25rem] p-[1rem]",
          "bg-gradient-to-br border border-[color:var(--color-border)]",
          "shadow-[0 1px 2px oklch(20% 0.01 285 / 0.06), 0 1px 1px oklch(20% 0.01 285 / 0.04)] hover:shadow-[0 4px 12px oklch(20% 0.01 285 / 0.08), 0 2px 4px oklch(20% 0.01 285 / 0.04)]",
          "transition-shadow duration-[240ms]",
          ACCENT_GRADIENT[tool.category],
        ].join(" ")}
      >
        <span className="text-3xl" aria-hidden>
          {tool.icon}
        </span>
        <div className="flex-1">
          <h3 className="text-[length:0.9375rem] font-semibold text-[color:var(--color-fg)]">
            {tool.title}
          </h3>
          <p className="mt-0.5 text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">
            {tool.blurb}
          </p>
          {totalCount > 0 && (
            <p className="mt-1 text-[length:0.6875rem] text-[color:var(--color-fg-subtle)]">
              {todayCount > 0 ? `Heute: ${todayCount} · ` : ""}
              gesamt: {totalCount}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
