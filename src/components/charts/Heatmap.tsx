import { useMemo } from 'react'
import { dayKeyAddDays, dayKeyForDate } from '../../lib/stats/dayKey'

type Palette = readonly [string, string, string, string, string]

interface HeatmapProps {
  /** Map of dayKey ("YYYY-MM-DD") → intensity 0..1 (or null for "no data") */
  values: ReadonlyMap<string, number | null>
  weeks?: number
  today?: Date
  cellSize?: number
  cellGap?: number
  ariaLabel?: string
  /** Custom palette: 0 = empty, 1 = max. */
  palette?: Palette
}

const DEFAULT_PALETTE: Palette = [
  '#f4f4f5', // zinc-100 — empty
  '#bbf7d0', // green-200
  '#4ade80', // green-400
  '#16a34a', // green-600
  '#15803d', // green-700
]

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
]

export function Heatmap({
  values,
  weeks = 26,
  today = new Date(),
  cellSize = 12,
  cellGap = 2,
  ariaLabel = 'Heatmap',
  palette = DEFAULT_PALETTE,
}: HeatmapProps) {
  const grid = useMemo(() => buildGrid(weeks, today), [weeks, today])
  const width = weeks * (cellSize + cellGap)
  const height = 7 * (cellSize + cellGap) + 16

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
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
          className="text-zinc-500 dark:text-zinc-400"
        >
          {label}
        </text>
      ))}
      <g transform="translate(0, 16)">
        {grid.cells.map(({ day, x, y }) => {
          const v = values.get(day)
          const fill =
            v === undefined || v === null ? palette[0] : palette[bucket(v)]
          return (
            <rect
              key={day}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={fill}
            >
              <title>{`${day}: ${v == null ? '—' : v.toFixed(2)}`}</title>
            </rect>
          )
        })}
      </g>
    </svg>
  )
}

function bucket(v: number): 1 | 2 | 3 | 4 {
  if (v <= 0.25) return 1
  if (v <= 0.5) return 2
  if (v <= 0.75) return 3
  return 4
}

interface Cell {
  day: string
  x: number
  y: number
}

interface MonthLabel {
  x: number
  label: string
}

function buildGrid(
  weeks: number,
  today: Date,
): { cells: Cell[]; monthLabels: MonthLabel[] } {
  const cells: Cell[] = []
  const monthLabels: MonthLabel[] = []
  let lastMonth = -1

  // Anchor the rightmost column on today's weekday and walk backwards.
  const todayKey = dayKeyForDate(today)
  const todayWeekday = today.getDay()
  const totalDays = weeks * 7
  const startDayKey = dayKeyAddDays(
    todayKey,
    -(totalDays - 1 - (6 - todayWeekday)),
  )

  let dayCursor = startDayKey
  for (let col = 0; col < weeks; col++) {
    for (let row = 0; row < 7; row++) {
      const x = col * 14
      const y = row * 14
      cells.push({ day: dayCursor, x, y })
      dayCursor = dayKeyAddDays(dayCursor, 1)
    }
    const month = Number(dayCursor.split('-')[1]) - 1
    if (month !== lastMonth && col % 4 === 0) {
      monthLabels.push({ x: col * 14, label: MONTHS_SHORT[month] })
      lastMonth = month
    }
  }
  return { cells, monthLabels }
}
