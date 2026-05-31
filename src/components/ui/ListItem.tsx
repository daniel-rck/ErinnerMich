import { ChevronRight } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

export interface ListItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /**
   * When true, renders a chevron-right trailing affordance (if `trailing` is empty).
   */
  navigates?: boolean;
  /**
   * Render as a non-interactive row (e.g. read-only setting). Skips button behavior.
   */
  static?: boolean;
  className?: string;
}

export const ListItem = forwardRef<HTMLButtonElement, ListItemProps>(function ListItem(
  {
    leading,
    title,
    subtitle,
    trailing,
    navigates = false,
    static: isStatic = false,
    className = "",
    type = "button",
    ...rest
  },
  ref,
) {
  const inner = (
    <>
      {leading && <div className="flex shrink-0 items-center justify-center">{leading}</div>}
      <div className="min-w-0 flex-1 text-left">
        <div className="text-[length:var(--text-body)] font-medium text-[color:var(--color-text-primary)]">
          {title}
        </div>
        {subtitle && (
          <div className="text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
            {subtitle}
          </div>
        )}
      </div>
      {trailing != null ? (
        <div className="flex shrink-0 items-center gap-2 text-[color:var(--color-text-tertiary)]">
          {trailing}
        </div>
      ) : navigates ? (
        <ChevronRight
          size={18}
          aria-hidden
          className="shrink-0 text-[color:var(--color-text-tertiary)]"
        />
      ) : null}
    </>
  );

  if (isStatic) {
    return (
      <div
        className={[
          "flex w-full items-center gap-3 px-[var(--space-md)] py-[var(--space-sm)]",
          className,
        ].join(" ")}
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={[
        "flex w-full items-center gap-3 px-[var(--space-md)] py-[var(--space-sm)]",
        "text-left",
        "transition-[background-color] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
        "hover:bg-[color:var(--color-surface-sunken)] active:bg-[color:var(--color-border-subtle)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {inner}
    </button>
  );
});
