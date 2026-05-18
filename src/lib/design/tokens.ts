export const SURFACE = {
  base: 'bg-[var(--color-surface)]',
  elevated: 'bg-[var(--color-surface-elevated)]',
  sunken: 'bg-[var(--color-surface-sunken)]',
  glass: 'surface-glass',
  glassStrong: 'surface-glass-strong',
} as const

export const BORDER = {
  subtle: 'border border-[color:var(--color-border-subtle)]',
  strong: 'border border-[color:var(--color-border-strong)]',
} as const

export const TEXT = {
  primary: 'text-[color:var(--color-text-primary)]',
  secondary: 'text-[color:var(--color-text-secondary)]',
  tertiary: 'text-[color:var(--color-text-tertiary)]',
  onBrand: 'text-[color:var(--color-text-on-brand)]',
} as const

export const ELEV = {
  0: 'shadow-[var(--elev-0)]',
  1: 'shadow-[var(--elev-1)]',
  2: 'shadow-[var(--elev-2)]',
  3: 'shadow-[var(--elev-3)]',
  brand: 'shadow-[var(--elev-brand)]',
} as const

export const RADIUS = {
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  xl: 'rounded-[var(--radius-xl)]',
  pill: 'rounded-full',
} as const

export const TYPE = {
  display: 'text-[length:var(--text-display)] leading-[var(--leading-display)] tracking-[var(--tracking-tight)] font-semibold',
  title1: 'text-[length:var(--text-title-1)] leading-[var(--leading-title)] tracking-[var(--tracking-tight)] font-semibold',
  title2: 'text-[length:var(--text-title-2)] leading-[var(--leading-title)] font-semibold',
  title3: 'text-[length:var(--text-title-3)] leading-[var(--leading-body)] font-medium',
  body: 'text-[length:var(--text-body)] leading-[var(--leading-body)]',
  caption: 'text-[length:var(--text-caption)] leading-[var(--leading-body)] text-[color:var(--color-text-secondary)]',
  micro: 'text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]',
} as const

export type AccentKey = 'brand' | 'mood' | 'calm' | 'grow' | 'glow'

export const ACCENT_GRADIENT: Record<AccentKey, string> = {
  brand: 'from-[color:var(--color-brand-400)] to-[color:var(--color-brand-600)]',
  mood: 'from-[color:var(--color-accent-mood)] to-[color:var(--color-accent-glow)]',
  calm: 'from-[color:var(--color-accent-calm)] to-[color:var(--color-brand-400)]',
  grow: 'from-[color:var(--color-accent-grow)] to-[color:var(--color-accent-calm)]',
  glow: 'from-[color:var(--color-accent-glow)] to-[color:var(--color-accent-mood)]',
}

export const ACCENT_SOFT: Record<AccentKey, string> = {
  brand: 'bg-[color:var(--color-brand-50)]',
  mood: 'bg-[color:var(--color-accent-mood-soft)]',
  calm: 'bg-[color:var(--color-accent-calm-soft)]',
  grow: 'bg-[color:var(--color-accent-grow-soft)]',
  glow: 'bg-[color:var(--color-accent-glow-soft)]',
}
