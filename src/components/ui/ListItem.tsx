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
        <div className="text-[length:0.9375rem] font-medium text-[color:var(--color-fg)]">
          {title}
        </div>
        {subtitle && (
          <div className="text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">
            {subtitle}
          </div>
        )}
      </div>
      {trailing != null ? (
        <div className="flex shrink-0 items-center gap-2 text-[color:var(--color-fg-subtle)]">
          {trailing}
        </div>
      ) : navigates ? (
        <ChevronRight
          size={18}
          aria-hidden
          className="shrink-0 text-[color:var(--color-fg-subtle)]"
        />
      ) : null}
    </>
  );

  if (isStatic) {
    return (
      <div
        className={["flex w-full items-center gap-3 px-[1rem] py-[0.75rem]", className].join(" ")}
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
        "flex w-full items-center gap-3 px-[1rem] py-[0.75rem]",
        "text-left",
        "transition-[background-color] duration-[140ms] ease-[cubic-bezier(0.2,0,0,1)]",
        "hover:bg-[color:var(--color-surface-sunken)] active:bg-[color:var(--color-border)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {inner}
    </button>
  );
});
