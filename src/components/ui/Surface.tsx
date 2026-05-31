import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { categoryClasses } from "../../lib/categoryColors";
import type { CategoryKey } from "../../lib/types";

export type SurfaceVariant = "flat" | "raised" | "glass" | "sunken" | "outline";
export type SurfaceRadius = "sm" | "md" | "lg" | "xl";
export type SurfacePadding = "none" | "sm" | "md" | "lg";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  radius?: SurfaceRadius;
  padding?: SurfacePadding;
  accentBorder?: CategoryKey;
  as?: "div" | "section" | "article" | "aside" | "header" | "footer";
  children?: ReactNode;
}

const VARIANT: Record<SurfaceVariant, string> = {
  flat: "bg-[color:var(--color-surface)]",
  raised:
    "bg-[color:var(--color-surface)] shadow-[0 1px 2px oklch(20% 0.01 285 / 0.06), 0 1px 1px oklch(20% 0.01 285 / 0.04)] border border-[color:var(--color-border)]",
  glass: "surface-glass",
  sunken: "bg-[color:var(--color-surface-sunken)] border border-[color:var(--color-border)]",
  outline: "bg-transparent border border-[color:var(--color-border)]",
};

const RADIUS: Record<SurfaceRadius, string> = {
  sm: "rounded-[0.5rem]",
  md: "rounded-[0.875rem]",
  lg: "rounded-[1.25rem]",
  xl: "rounded-[1.75rem]",
};

const PADDING: Record<SurfacePadding, string> = {
  none: "",
  sm: "p-[0.75rem]",
  md: "p-[1rem]",
  lg: "p-[1.5rem]",
};

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  {
    variant = "raised",
    radius = "lg",
    padding = "md",
    accentBorder,
    as = "div",
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const Tag = as as "div";
  const accentClass = accentBorder ? `border-l-4 ${categoryClasses(accentBorder).borderL}` : "";
  return (
    <Tag
      ref={ref}
      className={[VARIANT[variant], RADIUS[radius], PADDING[padding], accentClass, className].join(
        " ",
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});
