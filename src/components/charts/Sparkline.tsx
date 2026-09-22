interface SparklineProps {
  data: ReadonlyArray<{ label: string; value: number | null }>;
  min?: number;
  max?: number;
  ariaLabel?: string;
}

export function Sparkline({ data, min = 1, max = 5, ariaLabel = "Verlauf" }: SparklineProps) {
  const width = 320;
  const height = 64;
  const padX = 4;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const range = max - min || 1; // flat scale: avoid dividing by zero
  const points = data.map((p, i) => {
    if (p.value === null) return null;
    const t = (p.value - min) / range;
    const x = padX + i * stepX;
    const y = padY + (1 - t) * innerH;
    return { x, y, label: p.label, value: p.value };
  });

  const segments = collectSegments(points);
  const known = data.flatMap((p) => (p.value === null ? [] : [p.value]));
  const avg = known.length > 0 ? known.reduce((a, b) => a + b, 0) / known.length : null;
  const summary =
    avg === null
      ? `${ariaLabel}: keine Daten`
      : `${ariaLabel}: Durchschnitt ${avg.toLocaleString("de-DE", { maximumFractionDigits: 1 })} an ${known.length} Tagen`;

  return (
    <svg
      role="img"
      aria-label={summary}
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
    >
      {segments.map((segment, i) => (
        <polyline
          // oxlint-disable-next-line react/no-array-index-key -- segments are derived fresh from `points` on every render and hold no state — the index is their only identity.
          key={i}
          fill="none"
          style={{ stroke: "var(--color-accent-500)" }}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={segment.map((p) => `${p.x},${p.y}`).join(" ")}
        />
      ))}
      {points.map((p) =>
        p === null ? null : (
          <circle
            key={p.label}
            cx={p.x}
            cy={p.y}
            r={2.5}
            style={{ fill: "var(--color-accent-500)" }}
          >
            <title>{`${p.label}: ${p.value.toLocaleString("de-DE", { maximumFractionDigits: 1 })}`}</title>
          </circle>
        ),
      )}
    </svg>
  );
}

function collectSegments<T>(points: ReadonlyArray<T | null>): T[][] {
  const segments: T[][] = [];
  let current: T[] = [];
  for (const p of points) {
    if (p === null) {
      if (current.length > 1) segments.push(current);
      current = [];
    } else {
      current.push(p);
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}
