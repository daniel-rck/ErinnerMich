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
  brand: "bg-[color:var(--color-brand-500)]",
  mood: "bg-[color:var(--color-accent-mood)]",
  calm: "bg-[color:var(--color-accent-calm)]",
  grow: "bg-[color:var(--color-accent-grow)]",
  glow: "bg-[color:var(--color-accent-glow)]",
};

const VALUE_SIZE: Record<NonNullable<StatTileProps["size"]>, string> = {
  sm: "text-[length:var(--text-title-2)] font-semibold",
  md: "text-[length:var(--text-title-1)] font-semibold",
  lg: "text-[length:var(--text-display)] font-semibold tracking-[var(--tracking-tight)]",
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
        : "text-[color:var(--color-text-tertiary)]";

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          <span
            className={["inline-block h-1.5 w-1.5 rounded-full", ACCENT_DOT[accent]].join(" ")}
          />
          {label}
        </div>
        {Icon && <Icon size={16} aria-hidden className="text-[color:var(--color-text-tertiary)]" />}
      </div>
      <div
        className={[
          VALUE_SIZE[size],
          "mt-1 tabular-nums text-[color:var(--color-text-primary)]",
        ].join(" ")}
      >
        {value}
      </div>
      {(trend || spark) && (
        <div className="mt-1.5 flex items-end justify-between gap-2">
          {trend ? (
            <div
              className={[
                "inline-flex items-center gap-0.5 text-[length:var(--text-caption)] font-medium",
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
          "block w-full text-left rounded-[var(--radius-lg)]",
          "bg-[color:var(--color-surface-elevated)] border border-[color:var(--color-border-subtle)] shadow-[var(--elev-1)]",
          "p-[var(--space-md)]",
          "transition-[transform,box-shadow] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
          "hover:shadow-[var(--elev-2)] active:scale-[0.98]",
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
