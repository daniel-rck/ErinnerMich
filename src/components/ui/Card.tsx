import { forwardRef, type ReactNode } from 'react'
import { Surface, type SurfaceProps } from './Surface'

export interface CardProps extends SurfaceProps {
  header?: ReactNode
  footer?: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { header, footer, children, className = '', padding = 'md', ...rest },
  ref,
) {
  if (!header && !footer) {
    return (
      <Surface ref={ref} padding={padding} className={className} {...rest}>
        {children}
      </Surface>
    )
  }
  return (
    <Surface ref={ref} padding="none" className={className} {...rest}>
      {header && (
        <div className="flex items-center justify-between gap-3 px-[var(--space-md)] pt-[var(--space-md)] pb-[var(--space-sm)]">
          {header}
        </div>
      )}
      <div className="px-[var(--space-md)] pb-[var(--space-md)]">{children}</div>
      {footer && (
        <div className="border-t border-[color:var(--color-border-subtle)] px-[var(--space-md)] py-[var(--space-sm)]">
          {footer}
        </div>
      )}
    </Surface>
  )
})
