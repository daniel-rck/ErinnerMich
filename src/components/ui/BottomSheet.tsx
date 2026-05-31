import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { type ReactNode, useEffect, useId } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  labelledBy?: string;
}

export function BottomSheet({ open, onClose, title, children, labelledBy }: BottomSheetProps) {
  const controls = useDragControls();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

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
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
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
            className="relative w-full max-w-2xl rounded-t-3xl border-t border-zinc-200 bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              onPointerDown={(event) => controls.start(event)}
              className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing"
              aria-hidden
            >
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            {title && (
              <h2 id={titleId} className="px-5 pb-3 text-base font-semibold">
                {title}
              </h2>
            )}
            <div className="max-h-[75vh] overflow-y-auto px-5 pb-2">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
