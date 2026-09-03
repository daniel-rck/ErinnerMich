interface CardSkeletonProps {
  count?: number;
  variant?: "card" | "row";
}

export function CardSkeleton({ count = 3, variant = "card" }: CardSkeletonProps) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) =>
        // biome-ignore lint/suspicious/noArrayIndexKey: interchangeable, stateless loading placeholders — nothing to preserve across reorders.
        variant === "card" ? <Card key={i} /> : <Row key={i} />,
      )}
    </div>
  );
}

function Card() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-border" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-border" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-border" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-20 animate-pulse rounded-md bg-border" />
        <div className="h-7 w-24 animate-pulse rounded-md bg-border" />
      </div>
    </div>
  );
}

function Row() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="h-8 w-8 animate-pulse rounded-md bg-border" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-border" />
        <div className="h-2 w-1/4 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}
