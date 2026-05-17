import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { categoryClasses } from '../../lib/categoryColors'
import type { CategoryKey } from '../../lib/types'

export type SurfaceVariant = 'flat' | 'raised' | 'glass' | 'sunken' | 'outline'
export type SurfaceRadius = 'sm' | 'md' | 'lg' | 'xl'
export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg'

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant
  radius?: SurfaceRadius
  padding?: SurfacePadding
  accentBorder?: CategoryKey
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer'
  children?: ReactNode
}

const VARIANT: Record<SurfaceVariant, string> = {
  flat: 'bg-[color:var(--color-surface-elevated)]',
  raised: 'bg-[color:var(--color-surface-elevated)] shadow-[var(--elev-1)] border border-[color:var(--color-border-subtle)]',
  glass: 'surface-glass',
  sunken: 'bg-[color:var(--color-surface-sunken)] border border-[color:var(--color-border-subtle)]',
  outline: 'bg-transparent border border-[color:var(--color-border-subtle)]',
}

const RADIUS: Record<SurfaceRadius, string> = {
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  xl: 'rounded-[var(--radius-xl)]',
}

const PADDING: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-[var(--space-sm)]',
  md: 'p-[var(--space-md)]',
  lg: 'p-[var(--space-lg)]',
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  {
    variant = 'raised',
    radius = 'lg',
    padding = 'md',
    accentBorder,
    as = 'div',
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const Tag = as as 'div'
  const accentClass = accentBorder
    ? `border-l-4 ${categoryClasses(accentBorder).borderL}`
    : ''
  return (
    <Tag
      ref={ref}
      className={[VARIANT[variant], RADIUS[radius], PADDING[padding], accentClass, className].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  )
})
