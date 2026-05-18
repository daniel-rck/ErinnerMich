import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { vibrate, type HapticPattern } from './Haptic'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leadingIcon?: LucideIcon
  trailingIcon?: LucideIcon
  fullWidth?: boolean
  haptic?: HapticPattern | false
  children?: ReactNode
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[length:var(--text-caption)] gap-1.5',
  md: 'h-11 px-4 text-[length:var(--text-body)] gap-2',
  lg: 'h-[52px] px-6 text-[length:var(--text-body)] gap-2 font-semibold',
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 }

const VARIANT: Record<ButtonVariant, string> = {
  primary: [
    'bg-[color:var(--color-brand-600)] text-[color:var(--color-text-on-brand)]',
    'shadow-[var(--elev-brand)]',
    'hover:bg-[color:var(--color-brand-700)]',
    'active:bg-[color:var(--color-brand-800)]',
    'disabled:bg-[color:var(--color-brand-300)] disabled:shadow-none',
  ].join(' '),
  secondary: [
    'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-primary)]',
    'border border-[color:var(--color-border-strong)]',
    'shadow-[var(--elev-1)]',
    'hover:bg-[color:var(--color-surface-sunken)]',
    'active:bg-[color:var(--color-surface-sunken)]',
  ].join(' '),
  tertiary: [
    'bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-primary)]',
    'hover:bg-[color:var(--color-border-subtle)]',
    'active:bg-[color:var(--color-border-strong)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[color:var(--color-text-primary)]',
    'hover:bg-[color:var(--color-surface-sunken)]',
    'active:bg-[color:var(--color-border-subtle)]',
  ].join(' '),
  danger: [
    'bg-[color:var(--color-danger)] text-[color:var(--color-text-on-brand)]',
    'shadow-[var(--elev-1)]',
    'hover:brightness-95 active:brightness-90',
  ].join(' '),
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon: Leading,
    trailingIcon: Trailing,
    fullWidth = false,
    haptic = 'tick',
    className = '',
    disabled,
    onClick,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const iconSize = ICON_SIZE[size]
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={(e) => {
        if (haptic) vibrate(haptic)
        onClick?.(e)
      }}
      className={[
        'inline-flex items-center justify-center select-none',
        'rounded-[var(--radius-md)]',
        'transition-[background-color,box-shadow,transform,filter] duration-[var(--motion-fast)] ease-[var(--motion-ease)]',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        SIZE[size],
        VARIANT[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block animate-spin rounded-full border-2 border-current border-r-transparent"
          style={{ width: iconSize, height: iconSize }}
          aria-hidden
        />
      ) : Leading ? (
        <Leading size={iconSize} strokeWidth={2} aria-hidden />
      ) : null}
      {children != null && <span>{children}</span>}
      {!loading && Trailing && <Trailing size={iconSize} strokeWidth={2} aria-hidden />}
    </button>
  )
})
