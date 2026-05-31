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

  const points = data.map((p, i) => {
    if (p.value === null) return null;
    const t = (p.value - min) / (max - min);
    const x = padX + i * stepX;
    const y = padY + (1 - t) * innerH;
    return { x, y, label: p.label, value: p.value };
  });

  const segments = collectSegments(points);

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
    >
      {segments.map((segment, i) => (
        <polyline
          key={i}
          fill="none"
          stroke="#10b981"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={segment.map((p) => `${p.x},${p.y}`).join(" ")}
        />
      ))}
      {points.map((p, i) =>
        p === null ? null : (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#10b981">
            <title>{`${p.label}: ${p.value.toFixed(2)}`}</title>
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
