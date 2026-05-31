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
    <div className="flex items-start gap-2 rounded-md bg-zinc-50 p-3 text-sm dark:bg-zinc-800/40">
      <CalendarClock
        size={16}
        className="mt-0.5 shrink-0 text-zinc-500 dark:text-zinc-400"
        aria-hidden
      />
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Vorschau
        </p>
        {occurrences.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">Keine zukünftigen Auslösungen.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-0.5">
            {occurrences.map((d) => (
              <li
                key={d.getTime()}
                className="flex items-baseline gap-2 text-zinc-700 dark:text-zinc-300"
              >
                <span className="capitalize">{formatRelativeDate(d, now)}</span>
                <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                  {formatTime(d)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
