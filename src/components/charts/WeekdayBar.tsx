interface WeekdayBarProps {
  data: ReadonlyArray<{ label: string; value: number | null; count: number }>;
  max?: number;
  ariaLabel?: string;
}

export function WeekdayBar({
  data,
  max = 5,
  ariaLabel = "Wochentags-Auswertung",
}: WeekdayBarProps) {
  const barWidth = 32;
  const gap = 12;
  const chartHeight = 80;
  const labelHeight = 20;
  const width = data.length * (barWidth + gap);
  const height = chartHeight + labelHeight;
  const known = data.filter((d) => d.value !== null);
  const best = known.reduce<(typeof data)[number] | null>(
    (acc, d) => (acc === null || (d.value ?? 0) > (acc.value ?? 0) ? d : acc),
    null,
  );
  const summary = best
    ? `${ariaLabel}: am besten ${best.label} mit ${fmt(best.value ?? 0)}`
    : `${ariaLabel}: keine Daten`;

  return (
    <svg
      role="img"
      aria-label={summary}
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
    >
      {data.map((point, i) => {
        const x = i * (barWidth + gap);
        const value = point.value ?? 0;
        const barHeight = point.value === null ? 0 : (value / max) * chartHeight;
        const fill =
          point.value === null ? "var(--color-border)" : interpolateMoodColor(point.value, max);
        return (
          <g key={point.label}>
            <rect
              x={x}
              y={chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx={3}
              style={{ fill }}
            >
              <title>{`${point.label}: ${
                point.value === null ? "—" : fmt(point.value)
              } (${point.count} Einträge)`}</title>
            </rect>
            {/* The value in text too — the bar colour alone doesn't carry it. */}
            {point.value !== null && (
              <text
                x={x + barWidth / 2}
                y={Math.max(10, chartHeight - barHeight - 3)}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                className="text-fg-muted"
              >
                {fmt(point.value)}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={chartHeight + 14}
              textAnchor="middle"
              fontSize={11}
              fill="currentColor"
              className="text-fg-muted"
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function fmt(value: number): string {
  return value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

function interpolateMoodColor(value: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - 1) / (max - 1)));
  if (t < 0.5) return "var(--color-danger)";
  if (t < 0.75) return "var(--color-warning)";
  return "var(--color-success)";
}
