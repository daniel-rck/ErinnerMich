import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { StatTile } from "../components/ui/StatTile";
import { categoryClasses } from "../lib/categoryColors";
import { getInventory } from "../lib/db/inventories";
import { getReminder } from "../lib/db/reminders";
import { formatDate, formatSchedule, formatTime } from "../lib/format";
import { useEvents } from "../lib/hooks/useEvents";
import { averageDaysBetweenCompletions, completionSummary } from "../lib/stats/completionRate";
import { streakStats } from "../lib/stats/streaks";
import type { Inventory, Reminder, ReminderEvent } from "../lib/types";

export function ReminderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const { events } = useEvents(id ?? null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      const [r, inv] = await Promise.all([getReminder(id), getInventory(id)]);
      if (cancelled) return;
      setReminder(r ?? null);
      setInventory(inv ?? null);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading)
    return <p className="text-[length:0.9375rem] text-[color:var(--color-fg-subtle)]">Lade …</p>;
  if (!reminder) {
    return (
      <div className="flex flex-col gap-[1rem]">
        <p className="text-[length:0.9375rem] text-[color:var(--color-fg-subtle)]">
          Reminder nicht gefunden.
        </p>
        <Button variant="secondary" onClick={() => navigate("/")}>
          Zurück
        </Button>
      </div>
    );
  }

  const streak = streakStats(events);
  const completions = completionSummary(events);
  const avgGap = averageDaysBetweenCompletions(events);
  const tone = categoryClasses(reminder.category);

  return (
    <div className="flex flex-col gap-[1.5rem]">
      {/* Hero */}
      <Card
        variant="raised"
        radius="xl"
        padding="lg"
        accentBorder={reminder.category}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-[color:var(--color-accent-400)] to-[color:var(--color-accent-500)] opacity-10 blur-3xl"
        />
        <div className="relative flex items-start gap-[1rem]">
          <span
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] text-4xl ${tone.iconBg}`}
            aria-hidden
          >
            {reminder.icon}
          </span>
          <div className="flex flex-1 flex-col">
            <p className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
              {reminder.kind === "habit" ? "Habit" : reminder.kind === "mood" ? "Mood" : "Reminder"}
            </p>
            <h1 className="text-[length:1.625rem] font-semibold leading-[1.25] tracking-[-0.02em] text-[color:var(--color-fg)]">
              {reminder.title}
            </h1>
            <p className="mt-1 text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">
              {formatSchedule(reminder.schedule)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={Pencil}
            onClick={() => navigate(`/edit/${reminder.id}`)}
          >
            <span className="hidden sm:inline">Bearbeiten</span>
          </Button>
        </div>
      </Card>

      {reminder.description && (
        <Card variant="sunken" radius="md" padding="md">
          <p className="text-[length:0.9375rem] text-[color:var(--color-fg)]">
            {reminder.description}
          </p>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-[0.5rem] sm:grid-cols-4">
        {reminder.kind === "habit" && (
          <>
            <StatTile label="Streak" value={`${streak.current}d`} accent="glow" size="sm" />
            <StatTile label="Längste" value={`${streak.longest}d`} accent="brand" size="sm" />
          </>
        )}
        <StatTile
          label="7-Tage"
          value={`${Math.round(completions.last7.rate * 100)}%`}
          accent="grow"
          size="sm"
        />
        <StatTile
          label="30-Tage"
          value={`${Math.round(completions.last30.rate * 100)}%`}
          accent="calm"
          size="sm"
        />
        {avgGap !== null && (
          <StatTile label="Ø Abstand" value={`${avgGap.toFixed(1)}d`} accent="mood" size="sm" />
        )}
      </section>

      {inventory && (
        <Card variant="raised" radius="lg" padding="md">
          <h2 className="mb-[0.5rem] text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
            Vorrat
          </h2>
          <p className="text-[length:0.9375rem] text-[color:var(--color-fg)]">
            {inventory.remaining} {inventory.unit} (Schwelle: {inventory.refillThreshold}{" "}
            {inventory.unit})
          </p>
          {inventory.lastRefillAt && (
            <p className="text-[length:0.8125rem] text-[color:var(--color-fg-subtle)]">
              Letztes Auffüllen: {formatDate(new Date(inventory.lastRefillAt))}
            </p>
          )}
        </Card>
      )}

      <section className="flex flex-col gap-[0.5rem]">
        <h2 className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
          Verlauf ({events.length} Einträge)
        </h2>
        {events.length === 0 ? (
          <p className="rounded-[0.875rem] border border-dashed border-[color:var(--color-border)] p-[1rem] text-[length:0.9375rem] text-[color:var(--color-fg-subtle)]">
            Noch keine Aktivität.
          </p>
        ) : (
          <Card variant="raised" radius="lg" padding="none">
            <ul className="flex flex-col">
              {events.slice(0, 50).map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function EventRow({ event }: { event: ReminderEvent }) {
  const ts = event.triggeredAt ?? event.scheduledFor;
  const date = ts ? new Date(ts) : null;
  return (
    <li className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-[1rem] py-[0.5rem] last:border-b-0">
      <span className="font-mono text-[length:0.8125rem] text-[color:var(--color-fg-subtle)]">
        {date ? `${formatDate(date)} ${formatTime(date)}` : "—"}
      </span>
      <span className="flex items-center gap-2">
        <ActionPill action={event.action} />
        {event.progress && (
          <span className="text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">
            +{event.progress.value} {event.progress.unit}
          </span>
        )}
        {event.note && (
          <span className="text-[length:0.8125rem] italic text-[color:var(--color-fg-muted)]">
            „{event.note}“
          </span>
        )}
      </span>
    </li>
  );
}

const ACTION_LABELS: Record<ReminderEvent["action"], string> = {
  completed: "Erledigt",
  snoozed: "Snooze",
  skipped: "Übersprungen",
  missed: "Verpasst",
  progress: "Fortschritt",
  dismissed: "Verworfen",
};

const ACTION_CLASSES: Record<ReminderEvent["action"], string> = {
  completed: "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
  snoozed: "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]",
  skipped: "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-fg-muted)]",
  missed: "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
  progress: "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]",
  dismissed: "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-fg-muted)]",
};

function ActionPill({ action }: { action: ReminderEvent["action"] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[length:0.6875rem] font-medium ${ACTION_CLASSES[action]}`}
    >
      {ACTION_LABELS[action]}
    </span>
  );
}
