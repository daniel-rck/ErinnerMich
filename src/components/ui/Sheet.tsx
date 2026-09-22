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
  // The footer sits outside the scroll area at full sheet width, and carries
  // the safe-area inset itself (it used to add it on top of the sheet's).
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      labelledBy={labelledBy}
      footer={footer}
    >
      {children}
    </BottomSheet>
  );
}
