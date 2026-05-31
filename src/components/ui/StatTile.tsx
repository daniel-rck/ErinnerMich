import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import type { AccentKey } from "../../lib/design/tokens";
import { Surface } from "./Surface";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  trend?: { delta: number; direction: "up" | "down" | "flat" };
  icon?: LucideIcon;
  accent?: AccentKey;
  size?: "sm" | "md" | "lg";
  spark?: ReactNode;
  ariaLabel?: string;
  onClick?: () => void;
  className?: string;
}

const ACCENT_DOT: Record<AccentKey, string> = {
  brand: "bg-[color:var(--color-accent-500)]",
  mood: "bg-[color:var(--color-accent-500)]",
  calm: "bg-[color:var(--color-accent-500)]",
  grow: "bg-[color:var(--color-accent-500)]",
  glow: "bg-[color:var(--color-accent-500)]",
};

const VALUE_SIZE: Record<NonNullable<StatTileProps["size"]>, string> = {
  sm: "text-[length:1.25rem] font-semibold",
  md: "text-[length:1.625rem] font-semibold",
  lg: "text-[length:clamp(2rem,5vw,2.75rem)] font-semibold tracking-[-0.02em]",
};

export const StatTile = forwardRef<HTMLDivElement, StatTileProps>(function StatTile(
  {
    label,
    value,
    trend,
    icon: Icon,
    accent = "brand",
    size = "md",
    spark,
    ariaLabel,
    onClick,
    className = "",
  },
  ref,
) {
  const TrendIcon =
    trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend?.direction === "up"
      ? "text-[color:var(--color-success)]"
      : trend?.direction === "down"
        ? "text-[color:var(--color-danger)]"
        : "text-[color:var(--color-fg-subtle)]";

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
          <span
            className={["inline-block h-1.5 w-1.5 rounded-full", ACCENT_DOT[accent]].join(" ")}
          />
          {label}
        </div>
        {Icon && <Icon size={16} aria-hidden className="text-[color:var(--color-fg-subtle)]" />}
      </div>
      <div
        className={[VALUE_SIZE[size], "mt-1 tabular-nums text-[color:var(--color-fg)]"].join(" ")}
      >
        {value}
      </div>
      {(trend || spark) && (
        <div className="mt-1.5 flex items-end justify-between gap-2">
          {trend ? (
            <div
              className={[
                "inline-flex items-center gap-0.5 text-[length:0.8125rem] font-medium",
                trendColor,
              ].join(" ")}
            >
              <TrendIcon size={14} aria-hidden />
              <span>{Math.abs(trend.delta)}%</span>
            </div>
          ) : (
            <span />
          )}
          {spark && <div className="flex-1">{spark}</div>}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={[
          "block w-full text-left rounded-[1.25rem]",
          "bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-[0 1px 2px oklch(20% 0.01 285 / 0.06), 0 1px 1px oklch(20% 0.01 285 / 0.04)]",
          "p-[1rem]",
          "transition-[transform,box-shadow] duration-[140ms] ease-[cubic-bezier(0.2,0,0,1)]",
          "hover:shadow-[0 4px 12px oklch(20% 0.01 285 / 0.08), 0 2px 4px oklch(20% 0.01 285 / 0.04)] active:scale-[0.98]",
          className,
        ].join(" ")}
      >
        {content}
      </button>
    );
  }

  return (
    <Surface ref={ref} variant="raised" radius="lg" padding="md" className={className}>
      {content}
    </Surface>
  );
});
