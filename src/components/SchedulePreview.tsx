import { CalendarClock } from "lucide-react";
import { useMemo } from "react";
import { formatRelativeDate, formatTime } from "../lib/format";
import { nextNOccurrences } from "../lib/schedule/nextOccurrence";
import type { Schedule } from "../lib/types";

interface SchedulePreviewProps {
  schedule: Schedule;
  count?: number;
}

export function SchedulePreview({ schedule, count = 3 }: SchedulePreviewProps) {
  const now = useMemo(() => new Date(), []);
  const occurrences = useMemo(() => nextNOccurrences(schedule, now, count), [schedule, now, count]);

  return (
    <div className="flex items-start gap-2 rounded-md bg-surface-sunken p-3 text-sm">
      <CalendarClock size={16} className="mt-0.5 shrink-0 text-fg-muted" aria-hidden />
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Vorschau</p>
        {occurrences.length === 0 ? (
          <p className="text-fg-muted">Keine zukünftigen Auslösungen.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-0.5">
            {occurrences.map((d) => (
              <li key={d.getTime()} className="flex items-baseline gap-2 text-fg-muted">
                <span className="capitalize">{formatRelativeDate(d, now)}</span>
                <span className="tabular-nums text-fg-muted">{formatTime(d)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
