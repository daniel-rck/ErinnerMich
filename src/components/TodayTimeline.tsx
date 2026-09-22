import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { formatTime } from "../lib/format";
import { useAllEvents } from "../lib/hooks/useAllEvents";
import { useNow } from "../lib/hooks/useNow";
import { planToday, type TodayBucket, type TodayItem } from "../lib/schedule/todayPlan";
import type { Reminder } from "../lib/types";
import { ReminderCard } from "./ReminderCard";

interface TodayTimelineProps {
  reminders: Reminder[];
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (reminder: Reminder) => void;
}

type BucketKey = TodayBucket;

type Bucket = {
  key: BucketKey;
  label: string;
  items: TodayItem[];
};

const BUCKETS: readonly { key: BucketKey; label: string }[] = [
  { key: "overdue", label: "Überfällig" },
  { key: "now", label: "Jetzt" },
  { key: "later", label: "Später heute" },
  { key: "done", label: "Erledigt heute" },
];

export function TodayTimeline({ reminders, onEdit, onDelete }: TodayTimelineProps) {
  const { events } = useAllEvents();
  const [doneCollapsed, setDoneCollapsed] = useState(true);

  // Ticks every minute, so "Später heute" moves to "Jetzt"/"Überfällig" on
  // its own and the day rolls over at midnight.
  const now = useNow();
  const buckets = useMemo<Bucket[]>(() => {
    const items = planToday(reminders, events, now);
    return BUCKETS.map((b) => ({ ...b, items: items.filter((i) => i.bucket === b.key) }));
  }, [reminders, events, now]);
  const totalItems = buckets.reduce((acc, b) => acc + b.items.length, 0);

  if (totalItems === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-fg-muted">
        Heute steht nichts an. 🎉
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {buckets.map((bucket) => {
        if (bucket.items.length === 0) return null;
        const collapsed = bucket.key === "done" && doneCollapsed;
        return (
          <section key={bucket.key} className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h2
                className={
                  "text-sm font-medium uppercase tracking-wide " + bucketLabelClass(bucket.key)
                }
              >
                {bucket.label}
                <span className="ml-2 tabular-nums opacity-70">{bucket.items.length}</span>
              </h2>
              {bucket.key === "done" && (
                <button
                  type="button"
                  onClick={() => setDoneCollapsed((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-surface-sunken"
                  aria-expanded={!collapsed}
                >
                  {collapsed ? "Anzeigen" : "Einklappen"}
                  <ChevronDown size={14} className={collapsed ? "" : "rotate-180"} />
                </button>
              )}
            </header>

            {!collapsed && (
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {bucket.items.map(({ reminder, scheduledFor, displayAt, snoozed }) => (
                    <CardRow
                      key={`${reminder.id}-${scheduledFor.getTime()}`}
                      reminder={reminder}
                      scheduledFor={scheduledFor}
                      displayAt={displayAt}
                      snoozed={snoozed}
                      bucket={bucket.key}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CardRow({
  reminder,
  scheduledFor,
  displayAt,
  snoozed,
  bucket,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  scheduledFor: Date;
  displayAt: Date;
  snoozed: boolean;
  bucket: BucketKey;
  onEdit?: (r: Reminder) => void;
  onDelete?: (r: Reminder) => void;
}) {
  const accent =
    bucket === "overdue"
      ? "border-l-4 border-l-danger"
      : bucket === "now"
        ? "border-l-4 border-l-accent-500"
        : bucket === "done"
          ? "opacity-60"
          : "";

  return (
    <div className={`rounded-xl ${accent}`}>
      <div className="flex items-baseline gap-3 px-1 pb-1 text-xs text-fg-muted">
        <span className="tabular-nums">{formatTime(displayAt)}</span>
        {bucket === "overdue" && <span className="text-danger-fg">überfällig</span>}
        {bucket === "now" && <span className="text-accent-600 dark:text-accent-400">jetzt</span>}
        {snoozed && <span>verschoben von {formatTime(scheduledFor)}</span>}
      </div>
      <ReminderCard
        reminder={reminder}
        scheduledFor={scheduledFor}
        done={bucket === "done"}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function bucketLabelClass(key: BucketKey): string {
  switch (key) {
    case "overdue":
      return "text-danger-fg";
    case "now":
      return "text-accent-600 dark:text-accent-400";
    case "done":
      return "text-fg-muted";
    default:
      return "text-fg-muted";
  }
}
