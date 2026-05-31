import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { categoryClasses } from "../../lib/categoryColors";
import type { CategoryKey } from "../../lib/types";

export type ChipTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  tone?: ChipTone;
  /**
   * Category-driven tone. Wins over `tone` when set. Pulls from categoryClasses().
   */
  category?: CategoryKey;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  size?: "sm" | "md";
  children?: ReactNode;
}

const NEUTRAL_SELECTED =
  "bg-[color:var(--color-brand-600)] text-[color:var(--color-text-on-brand)] border-transparent";
const NEUTRAL_IDLE =
  "bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-primary)] border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-sunken)]";

const TONE: Record<ChipTone, { selected: string; idle: string }> = {
  neutral: { selected: NEUTRAL_SELECTED, idle: NEUTRAL_IDLE },
  brand: {
    selected:
      "bg-[color:var(--color-brand-600)] text-[color:var(--color-text-on-brand)] border-transparent",
    idle: "bg-[color:var(--color-brand-50)] text-[color:var(--color-brand-700)] border-transparent hover:bg-[color:var(--color-brand-100)]",
  },
  success: {
    selected:
      "bg-[color:var(--color-success)] text-[color:var(--color-text-on-brand)] border-transparent",
    idle: "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)] border-transparent",
  },
  warning: {
    selected:
      "bg-[color:var(--color-warning)] text-[color:var(--color-text-on-brand)] border-transparent",
    idle: "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)] border-transparent",
  },
  danger: {
    selected:
      "bg-[color:var(--color-danger)] text-[color:var(--color-text-on-brand)] border-transparent",
    idle: "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)] border-transparent",
  },
  info: {
    selected:
      "bg-[color:var(--color-info)] text-[color:var(--color-text-on-brand)] border-transparent",
    idle: "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)] border-transparent",
  },
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  {
    selected = false,
    tone = "neutral",
    category,
    leadingIcon,
    trailingIcon,
    size = "md",
    className = "",
    type = "button",
    children,
    ...rest
  },
  ref,
) {
  const sizing =
    size === "sm"
      ? "h-7 px-2.5 text-[length:var(--text-micro)]"
      : "h-9 px-3 text-[length:var(--text-caption)]";
  let palette = TONE[tone].idle;
  if (selected) palette = TONE[tone].selected;
  if (category) {
    const cc = categoryClasses(category);
    palette = selected
      ? `${cc.iconBg} ${cc.text} border-transparent ring-2 ring-[color:var(--color-brand-500)]`
      : `${cc.bg} ${cc.text} border-transparent`;
  }
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected || undefined}
      className={[
        "inline-flex items-center gap-1.5 select-none border",
        "rounded-full font-medium",
        "transition-[background-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        sizing,
        palette,
        className,
      ].join(" ")}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});
