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
      <div className={footer ? "pb-[0.75rem]" : ""}>{children}</div>
      {footer && (
        <div
          className={[
            "sticky bottom-0 left-0 right-0 mt-[1rem]",
            "border-t border-[color:var(--color-border)]",
            "bg-[color:var(--color-surface)]",
            "px-[1rem] pt-[0.75rem] pb-[calc(env(safe-area-inset-bottom)+0.75rem)]",
          ].join(" ")}
        >
          {footer}
        </div>
      )}
    </BottomSheet>
  );
}
