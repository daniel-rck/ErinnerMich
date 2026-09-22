import { useMemo } from "react";
import { at } from "../../lib/at.ts";
import { dayKeyAddDays, dayKeyForDate } from "../../lib/stats/dayKey";

type Palette = readonly [string, string, string, string, string];

interface HeatmapProps {
  /** Map of dayKey ("YYYY-MM-DD") → intensity 0..1 (or null for "no data") */
  values: ReadonlyMap<string, number | null>;
  weeks?: number;
  today?: Date;
  cellSize?: number;
  cellGap?: number;
  ariaLabel?: string;
  /** Custom palette: 0 = empty, 1 = max. */
  palette?: Palette;
}

// Token-based so the empty cells follow dark mode (a fixed near-white hex
// lit up as bright tiles on the dark surface).
const DEFAULT_PALETTE: Palette = [
  "var(--color-surface-sunken)",
  "color-mix(in oklab, var(--color-success) 30%, var(--color-surface))",
  "color-mix(in oklab, var(--color-success) 55%, var(--color-surface))",
  "color-mix(in oklab, var(--color-success) 80%, var(--color-surface))",
  "var(--color-success)",
];

const DAY_LABEL = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" });

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

export function Heatmap({
  values,
  weeks = 26,
  today,
  cellSize = 12,
  cellGap = 2,
  ariaLabel = "Heatmap",
  palette = DEFAULT_PALETTE,
}: HeatmapProps) {
  const step = cellSize + cellGap;
  // Memo on the day, not the Date object — a `new Date()` default changed
  // identity every render and defeated the memo.
  const todayKey = dayKeyForDate(today ?? new Date());
  const grid = useMemo(() => buildGrid(weeks, todayKey, step), [weeks, todayKey, step]);
  const width = weeks * step;
  const height = 7 * step + 16;
  // `role="img"` hides the per-cell titles from screen readers, so the label
  // carries the summary.
  const activeDays = grid.cells.filter((c) => (values.get(c.day) ?? 0) > 0).length;
  const summary = `${ariaLabel}: an ${activeDays} von ${grid.cells.length} Tagen aktiv`;

  return (
    <svg
      role="img"
      aria-label={summary}
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
    >
      {grid.monthLabels.map(({ x, label }) => (
        <text
          key={`${x}-${label}`}
          x={x}
          y={10}
          fontSize={9}
          fill="currentColor"
          className="text-fg-muted"
        >
          {label}
        </text>
      ))}
      <g transform="translate(0, 16)">
        {grid.cells.map(({ day, x, y }) => {
          const v = values.get(day);
          const fill = v === undefined || v === null || v <= 0 ? palette[0] : palette[bucket(v)];
          return (
            <rect key={day} x={x} y={y} width={cellSize} height={cellSize} rx={2} style={{ fill }}>
              <title>{`${DAY_LABEL.format(parseKey(day))}: ${v == null ? "—" : `${Math.round(v * 100)} %`}`}</title>
            </rect>
          );
        })}
      </g>
    </svg>
  );
}

function bucket(v: number): 1 | 2 | 3 | 4 {
  if (v <= 0.25) return 1;
  if (v <= 0.5) return 2;
  if (v <= 0.75) return 3;
  return 4;
}

interface Cell {
  day: string;
  x: number;
  y: number;
}

interface MonthLabel {
  x: number;
  label: string;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function buildGrid(
  weeks: number,
  todayKey: string,
  step: number,
): { cells: Cell[]; monthLabels: MonthLabel[] } {
  const cells: Cell[] = [];
  const monthLabels: MonthLabel[] = [];
  let lastMonth = -1;
  let lastLabelCol = -Infinity;

  // Anchor the rightmost column on today's weekday and walk backwards.
  const todayWeekday = parseKey(todayKey).getDay();
  const totalDays = weeks * 7;
  const startDayKey = dayKeyAddDays(todayKey, -(totalDays - 1 - (6 - todayWeekday)));

  let dayCursor = startDayKey;
  for (let col = 0; col < weeks; col++) {
    // Label a column by the month of its first day, read before the cursor
    // moves on (it used to read the next week's month), whenever the month
    // changes and there is room since the previous label.
    const month = Number(at(dayCursor.split("-"), 1)) - 1;
    if (month !== lastMonth && col - lastLabelCol >= 3) {
      monthLabels.push({ x: col * step, label: at(MONTHS_SHORT, month) });
      lastMonth = month;
      lastLabelCol = col;
    }
    for (let row = 0; row < 7; row++) {
      const x = col * step;
      const y = row * step;
      cells.push({ day: dayCursor, x, y });
      dayCursor = dayKeyAddDays(dayCursor, 1);
    }
  }
  return { cells, monthLabels };
}
