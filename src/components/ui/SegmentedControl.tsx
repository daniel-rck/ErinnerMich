import { type ReactNode, useId } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel?: string;
  fullWidth?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  fullWidth = false,
  size = "md",
  className = "",
}: SegmentedControlProps<T>) {
  const groupId = useId();
  const height = size === "sm" ? "h-9" : "h-11";
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center gap-1 p-1",
        "bg-[color:var(--color-surface-sunken)]",
        "rounded-[0.875rem]",
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        const id = `${groupId}-${opt.value}`;
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
              "inline-flex items-center justify-center px-3",
              height,
              fullWidth ? "flex-1" : "",
              "rounded-[0.5rem]",
              "text-[length:0.8125rem] font-medium",
              "transition-[background-color,color,box-shadow] duration-[140ms] ease-[cubic-bezier(0.2,0,0,1)]",
              active
                ? "bg-[color:var(--color-surface)] text-[color:var(--color-fg)] shadow-[0 1px 2px oklch(20% 0.01 285 / 0.06), 0 1px 1px oklch(20% 0.01 285 / 0.04)]"
                : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
