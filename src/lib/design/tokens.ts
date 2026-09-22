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
  0: "shadow-[0_0_0_1px_var(--color-border)]",
  1: "shadow-[0_1px_2px_oklch(20%_0.01_285/0.06),0_1px_1px_oklch(20%_0.01_285/0.04)]",
  2: "shadow-[0_4px_12px_oklch(20%_0.01_285/0.08),0_2px_4px_oklch(20%_0.01_285/0.04)]",
  3: "shadow-[0_12px_32px_oklch(20%_0.01_285/0.14),0_4px_8px_oklch(20%_0.01_285/0.06)]",
  brand: "shadow-[0_8px_24px_oklch(54%_0.22_285/0.32)]",
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
