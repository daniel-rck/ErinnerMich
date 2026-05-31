export const SURFACE = {
  base: "bg-[var(--color-surface)]",
  elevated: "bg-[var(--color-surface)]",
  sunken: "bg-[var(--color-surface-sunken)]",
  glass: "surface-glass",
  glassStrong: "surface-glass-strong",
} as const;

export const BORDER = {
  subtle: "border border-[color:var(--color-border)]",
  strong: "border border-[color:var(--color-border)]",
} as const;

export const TEXT = {
  primary: "text-[color:var(--color-fg)]",
  secondary: "text-[color:var(--color-fg-muted)]",
  tertiary: "text-[color:var(--color-fg-subtle)]",
  onBrand: "text-[color:white]",
} as const;

export const ELEV = {
  0: "shadow-[0 0 0 1px var(--color-border)]",
  1: "shadow-[0 1px 2px oklch(20% 0.01 285 / 0.06), 0 1px 1px oklch(20% 0.01 285 / 0.04)]",
  2: "shadow-[0 4px 12px oklch(20% 0.01 285 / 0.08), 0 2px 4px oklch(20% 0.01 285 / 0.04)]",
  3: "shadow-[0 12px 32px oklch(20% 0.01 285 / 0.14), 0 4px 8px oklch(20% 0.01 285 / 0.06)]",
  brand: "shadow-[0 8px 24px oklch(54% 0.22 285 / 0.32)]",
} as const;

export const RADIUS = {
  sm: "rounded-[0.5rem]",
  md: "rounded-[0.875rem]",
  lg: "rounded-[1.25rem]",
  xl: "rounded-[1.75rem]",
  pill: "rounded-full",
} as const;

export const TYPE = {
  display: "text-[length:clamp(2rem,5vw,2.75rem)] leading-[1.1] tracking-[-0.02em] font-semibold",
  title1: "text-[length:1.625rem] leading-[1.25] tracking-[-0.02em] font-semibold",
  title2: "text-[length:1.25rem] leading-[1.25] font-semibold",
  title3: "text-[length:1rem] leading-[1.5] font-medium",
  body: "text-[length:0.9375rem] leading-[1.5]",
  caption: "text-[length:0.8125rem] leading-[1.5] text-[color:var(--color-fg-muted)]",
  micro:
    "text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]",
} as const;

export type AccentKey = "brand" | "mood" | "calm" | "grow" | "glow";

export const ACCENT_GRADIENT: Record<AccentKey, string> = {
  brand: "from-[color:var(--color-accent-400)] to-[color:var(--color-accent-600)]",
  mood: "from-[color:var(--color-accent-500)] to-[color:var(--color-accent-500)]",
  calm: "from-[color:var(--color-accent-500)] to-[color:var(--color-accent-400)]",
  grow: "from-[color:var(--color-accent-500)] to-[color:var(--color-accent-500)]",
  glow: "from-[color:var(--color-accent-500)] to-[color:var(--color-accent-500)]",
};

export const ACCENT_SOFT: Record<AccentKey, string> = {
  brand: "bg-[color:var(--color-accent-50)]",
  mood: "bg-[color:var(--color-accent-100)]",
  calm: "bg-[color:var(--color-accent-100)]",
  grow: "bg-[color:var(--color-accent-100)]",
  glow: "bg-[color:var(--color-accent-100)]",
};
