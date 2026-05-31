import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { formatTime } from "../lib/format";
import { useAllEvents } from "../lib/hooks/useAllEvents";
import { nextOccurrence } from "../lib/schedule/nextOccurrence";
import type { Reminder, ReminderEvent } from "../lib/types";
import { ReminderCard } from "./ReminderCard";

interface TodayTimelineProps {
  reminders: Reminder[];
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (reminder: Reminder) => void;
}

interface TimelineItem {
  reminder: Reminder;
  scheduledFor: Date;
}

type BucketKey = "overdue" | "now" | "later" | "done";

interface Bucket {
  key: BucketKey;
  label: string;
  items: TimelineItem[];
}

const NOW_WINDOW_MS = 30 * 60_000;

export function TodayTimeline({ reminders, onEdit, onDelete }: TodayTimelineProps) {
  const { events } = useAllEvents();
  const [doneCollapsed, setDoneCollapsed] = useState(true);

  const buckets = useMemo(() => buildBuckets(reminders, events), [reminders, events]);
  const totalItems = buckets.reduce((acc, b) => acc + b.items.length, 0);

  if (totalItems === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
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
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
                  {bucket.items.map(({ reminder, scheduledFor }) => (
                    <CardRow
                      key={reminder.id}
                      reminder={reminder}
                      scheduledFor={scheduledFor}
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
  bucket,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  scheduledFor: Date;
  bucket: BucketKey;
  onEdit?: (r: Reminder) => void;
  onDelete?: (r: Reminder) => void;
}) {
  const accent =
    bucket === "overdue"
      ? "border-l-4 border-l-rose-500"
      : bucket === "now"
        ? "border-l-4 border-l-accent-500"
        : bucket === "done"
          ? "opacity-60"
          : "";

  return (
    <div className={`rounded-xl ${accent}`}>
      <div className="flex items-baseline gap-3 px-1 pb-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="tabular-nums">{formatTime(scheduledFor)}</span>
        {bucket === "overdue" && (
          <span className="text-rose-600 dark:text-rose-400">überfällig</span>
        )}
        {bucket === "now" && <span className="text-accent-600 dark:text-accent-400">jetzt</span>}
      </div>
      <ReminderCard
        reminder={reminder}
        scheduledFor={scheduledFor}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function bucketLabelClass(key: BucketKey): string {
  switch (key) {
    case "overdue":
      return "text-rose-600 dark:text-rose-400";
    case "now":
      return "text-accent-600 dark:text-accent-400";
    case "done":
      return "text-zinc-500 dark:text-zinc-400";
    default:
      return "text-zinc-500 dark:text-zinc-400";
  }
}

function buildBuckets(reminders: Reminder[], events: readonly ReminderEvent[]): Bucket[] {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const completedToday = new Set<string>();
  for (const e of events) {
    if (e.action !== "completed") continue;
    const ts = e.triggeredAt ?? e.scheduledFor;
    if (ts == null) continue;
    if (ts < dayStart.getTime() || ts > dayEnd.getTime()) continue;
    completedToday.add(e.reminderId);
  }

  const items: TimelineItem[] = [];
  for (const reminder of reminders) {
    if (!reminder.active) continue;
    if (reminder.archivedAt != null) continue;
    const next = nextOccurrence(reminder.schedule, dayStart);
    if (!next) continue;
    if (next.getTime() > dayEnd.getTime()) continue;
    items.push({ reminder, scheduledFor: next });
  }
  items.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  const overdue: TimelineItem[] = [];
  const nowItems: TimelineItem[] = [];
  const later: TimelineItem[] = [];
  const done: TimelineItem[] = [];

  for (const item of items) {
    if (completedToday.has(item.reminder.id)) {
      done.push(item);
      continue;
    }
    const delta = item.scheduledFor.getTime() - now.getTime();
    if (delta < -NOW_WINDOW_MS) overdue.push(item);
    else if (delta <= NOW_WINDOW_MS) nowItems.push(item);
    else later.push(item);
  }

  return [
    { key: "overdue", label: "Überfällig", items: overdue },
    { key: "now", label: "Jetzt", items: nowItems },
    { key: "later", label: "Später heute", items: later },
    { key: "done", label: "Erledigt heute", items: done },
  ];
}
