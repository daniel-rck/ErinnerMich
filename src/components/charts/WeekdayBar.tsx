interface WeekdayBarProps {
  data: ReadonlyArray<{ label: string; value: number | null; count: number }>
  max?: number
  ariaLabel?: string
}

export function WeekdayBar({
  data,
  max = 5,
  ariaLabel = 'Wochentags-Auswertung',
}: WeekdayBarProps) {
  const barWidth = 32
  const gap = 12
  const chartHeight = 80
  const labelHeight = 20
  const width = data.length * (barWidth + gap)
  const height = chartHeight + labelHeight

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
    >
      {data.map((point, i) => {
        const x = i * (barWidth + gap)
        const value = point.value ?? 0
        const barHeight =
          point.value === null ? 0 : (value / max) * chartHeight
        const fill =
          point.value === null
            ? '#e4e4e7'
            : interpolateMoodColor(point.value, max)
        return (
          <g key={point.label}>
            <rect
              x={x}
              y={chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx={3}
              fill={fill}
            >
              <title>{`${point.label}: ${
                point.value === null ? '—' : point.value.toFixed(2)
              } (${point.count})`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={chartHeight + 14}
              textAnchor="middle"
              fontSize={11}
              fill="currentColor"
              className="text-zinc-500 dark:text-zinc-400"
            >
              {point.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function interpolateMoodColor(value: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - 1) / (max - 1)))
  // 1 → rose-500, max → emerald-500
  if (t < 0.5) {
    return '#f43f5e'
  }
  if (t < 0.75) {
    return '#f59e0b'
  }
  return '#10b981'
}
