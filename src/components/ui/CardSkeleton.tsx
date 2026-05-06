interface CardSkeletonProps {
  count?: number
  variant?: 'card' | 'row'
}

export function CardSkeleton({ count = 3, variant = 'card' }: CardSkeletonProps) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) =>
        variant === 'card' ? <Card key={i} /> : <Row key={i} />,
      )}
    </div>
  )
}

function Card() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-7 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}

function Row() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-8 w-8 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-2 w-1/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}
