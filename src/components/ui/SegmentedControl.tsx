import { useId, type ReactNode } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  ariaLabel?: string
}

export interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: SegmentedOption<T>[]
  ariaLabel?: string
  fullWidth?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  fullWidth = false,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const groupId = useId()
  const height = size === 'sm' ? 'h-9' : 'h-11'
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center gap-1 p-1',
        'bg-[color:var(--color-surface-sunken)]',
        'rounded-[var(--radius-md)]',
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {options.map((opt) => {
        const active = value === opt.value
        const id = `${groupId}-${opt.value}`
        return (
          <button
            key={opt.value}
            id={id}
            role="radio"
            type="button"
            aria-checked={active}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
            className={[
              'inline-flex items-center justify-center px-3',
              height,
              fullWidth ? 'flex-1' : '',
              'rounded-[var(--radius-sm)]',
              'text-[length:var(--text-caption)] font-medium',
              'transition-[background-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--motion-ease)]',
              active
                ? 'bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-primary)] shadow-[var(--elev-1)]'
                : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
