import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useId, useRef } from "react";
import { useOverlay } from "./useOverlay";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  labelledBy?: string;
  /** Rendered pinned below the scroll area (see `Sheet`). */
  footer?: ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  labelledBy,
  footer,
}: BottomSheetProps) {
  const controls = useDragControls();
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  useOverlay(open, onClose, sheetRef);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-[color:oklch(0.15_0_0/0.5)] backdrop-blur-sm"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
            ref={sheetRef}
            tabIndex={-1}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={[
              "relative flex w-full max-w-2xl flex-col rounded-t-3xl border-t border-border bg-surface shadow-2xl outline-none",
              // The safe-area inset is applied once — by the footer when there
              // is one, otherwise here.
              footer ? "" : "pb-[calc(env(safe-area-inset-bottom)+1rem)]",
            ].join(" ")}
          >
            <div
              onPointerDown={(event) => controls.start(event)}
              className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing"
              aria-hidden
            >
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="flex items-start justify-between gap-3 px-5 pb-3">
              {title ? (
                <h2 id={titleId} className="text-base font-semibold">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              {/* The drag handle is pointer-only; this is the way out for keyboard and screen readers. */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Schließen"
                className="-my-1 -mr-1.5 rounded-md p-1.5 text-fg-muted hover:bg-surface-sunken hover:text-fg"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="max-h-[75dvh] overflow-y-auto px-5 pb-2">{children}</div>
            {footer && (
              <div className="border-t border-border bg-surface px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
