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
    return (
      <p className="text-[length:var(--text-body)] text-[color:var(--color-text-tertiary)]">
        Lade …
      </p>
    );
  if (!reminder) {
    return (
      <div className="flex flex-col gap-[var(--space-md)]">
        <p className="text-[length:var(--text-body)] text-[color:var(--color-text-tertiary)]">
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
    <div className="flex flex-col gap-[var(--space-lg)]">
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
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-[color:var(--color-brand-400)] to-[color:var(--color-accent-mood)] opacity-10 blur-3xl"
        />
        <div className="relative flex items-start gap-[var(--space-md)]">
          <span
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-lg)] text-4xl ${tone.iconBg}`}
            aria-hidden
          >
            {reminder.icon}
          </span>
          <div className="flex flex-1 flex-col">
            <p className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
              {reminder.kind === "habit" ? "Habit" : reminder.kind === "mood" ? "Mood" : "Reminder"}
            </p>
            <h1 className="text-[length:var(--text-title-1)] font-semibold leading-[var(--leading-title)] tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
              {reminder.title}
            </h1>
            <p className="mt-1 text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
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
          <p className="text-[length:var(--text-body)] text-[color:var(--color-text-primary)]">
            {reminder.description}
          </p>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-[var(--space-xs)] sm:grid-cols-4">
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
          <h2 className="mb-[var(--space-xs)] text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
            Vorrat
          </h2>
          <p className="text-[length:var(--text-body)] text-[color:var(--color-text-primary)]">
            {inventory.remaining} {inventory.unit} (Schwelle: {inventory.refillThreshold}{" "}
            {inventory.unit})
          </p>
          {inventory.lastRefillAt && (
            <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
              Letztes Auffüllen: {formatDate(new Date(inventory.lastRefillAt))}
            </p>
          )}
        </Card>
      )}

      <section className="flex flex-col gap-[var(--space-xs)]">
        <h2 className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          Verlauf ({events.length} Einträge)
        </h2>
        {events.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border-strong)] p-[var(--space-md)] text-[length:var(--text-body)] text-[color:var(--color-text-tertiary)]">
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
    <li className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border-subtle)] px-[var(--space-md)] py-[var(--space-xs)] last:border-b-0">
      <span className="font-mono text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
        {date ? `${formatDate(date)} ${formatTime(date)}` : "—"}
      </span>
      <span className="flex items-center gap-2">
        <ActionPill action={event.action} />
        {event.progress && (
          <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
            +{event.progress.value} {event.progress.unit}
          </span>
        )}
        {event.note && (
          <span className="text-[length:var(--text-caption)] italic text-[color:var(--color-text-secondary)]">
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
  skipped: "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-secondary)]",
  missed: "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
  progress: "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)]",
  dismissed: "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-secondary)]",
};

function ActionPill({ action }: { action: ReminderEvent["action"] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[length:var(--text-micro)] font-medium ${ACTION_CLASSES[action]}`}
    >
      {ACTION_LABELS[action]}
    </span>
  );
}
