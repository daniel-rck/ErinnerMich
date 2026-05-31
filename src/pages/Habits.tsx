import autoAnimate from "@formkit/auto-animate";
import { Flame, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HabitCard } from "../components/HabitCard";
import { CardSkeleton } from "../components/ui/CardSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { dayKey } from "../lib/db";
import { useReminders } from "../lib/hooks/useReminders";
import { HABIT_TEMPLATES } from "../lib/templates";

const SUGGESTED_KEYS = ["water", "steps", "meditate"];

interface HabitsPageProps {
  /**
   * When true, omits the page header — used when rendered inside Library tabs.
   */
  embedded?: boolean;
}

export function HabitsPage({ embedded = false }: HabitsPageProps = {}) {
  const navigate = useNavigate();
  const [today] = useState(() => dayKey(Date.now()));
  const { reminders, loading } = useReminders({
    kind: "habit",
    activeOnly: true,
  });
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gridRef.current) autoAnimate(gridRef.current);
  }, []);

  return (
    <div className="flex flex-col gap-[1rem]">
      {!embedded && (
        <header className="flex items-end justify-between">
          <div className="flex flex-col gap-[0.25rem]">
            <p className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
              Bibliothek
            </p>
            <h1 className="text-[length:clamp(2rem,5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[color:var(--color-fg)]">
              Habits
            </h1>
          </div>
        </header>
      )}

      {loading ? (
        <CardSkeleton count={3} />
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="Erste Habit anlegen"
          description="Wähle eine Vorlage oder lege selbst etwas an."
          primaryAction={{
            label: "Aus Vorlage",
            onClick: () => navigate("/new?kind=habit"),
            icon: Plus,
          }}
          secondaryAction={{
            label: "Eigener Habit",
            onClick: () => navigate("/new?kind=habit"),
          }}
        />
      ) : (
        <>
          <div ref={gridRef} className="grid gap-[0.75rem] sm:grid-cols-2">
            {reminders.map((reminder) => (
              <HabitCard key={reminder.id} reminder={reminder} today={today} />
            ))}
          </div>
          <SuggestedFooter />
        </>
      )}
    </div>
  );
}

function SuggestedFooter() {
  const navigate = useNavigate();
  const suggested = HABIT_TEMPLATES.filter((t) => SUGGESTED_KEYS.includes(t.key)).slice(0, 3);
  return (
    <div className="flex flex-wrap items-center gap-2 pt-[0.75rem]">
      <span className="text-[length:0.8125rem] text-[color:var(--color-fg-subtle)]">
        Vorschläge:
      </span>
      {suggested.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => navigate(`/new?kind=habit&title=${encodeURIComponent(t.title)}`)}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
            "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-fg)]",
            "border border-[color:var(--color-border)]",
            "text-[length:0.8125rem] font-medium",
            "hover:bg-[color:var(--color-accent-50)] hover:border-[color:var(--color-accent-400)]",
          ].join(" ")}
        >
          <span aria-hidden>{t.icon}</span>
          {t.title}
        </button>
      ))}
    </div>
  );
}
