import type { ReactNode } from "react";
import { BottomSheet } from "./BottomSheet";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /**
   * Sticky footer (typically a primary Button or button row). Renders pinned
   * to the bottom of the sheet with a top border and safe-area-aware padding.
   */
  footer?: ReactNode;
  labelledBy?: string;
}

/**
 * Modern wrapper over BottomSheet. Adds sticky footer support; future PRs may
 * add snap points. Existing BottomSheet API stays untouched for back-compat.
 */
export function Sheet({ open, onClose, title, children, footer, labelledBy }: SheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} labelledBy={labelledBy}>
      <div className={footer ? "pb-[var(--space-sm)]" : ""}>{children}</div>
      {footer && (
        <div
          className={[
            "sticky bottom-0 left-0 right-0 mt-[var(--space-md)]",
            "border-t border-[color:var(--color-border-subtle)]",
            "bg-[color:var(--color-surface-elevated)]",
            "px-[var(--space-md)] pt-[var(--space-sm)] pb-[calc(env(safe-area-inset-bottom)+var(--space-sm))]",
          ].join(" ")}
        >
          {footer}
        </div>
      )}
    </BottomSheet>
  );
}
