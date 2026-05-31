import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { LONG_PRESS_MS } from "../lib/design/gestures";
import { useSettings } from "../lib/hooks/useSettings";
import { useMoodLog } from "./MoodLog/MoodLogProvider";
import { QuickCaptureSheet } from "./QuickCaptureSheet";
import { vibrate } from "./ui/Haptic";

interface CenterFabProps {
  /**
   * When true, renders a compact pill (desktop side-nav variant) instead of
   * the elevated bottom-nav circle. Same long-press behavior.
   */
  variant?: "circle" | "pill";
}

export function CenterFab({ variant = "circle" }: CenterFabProps) {
  const moodLog = useMoodLog();
  const { wellnessToolsEnabled } = useSettings();
  const [sheetOpen, setSheetOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  function startLongPress() {
    if (!wellnessToolsEnabled) return;
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      vibrate("tick");
      moodLog.open();
    }, LONG_PRESS_MS);
  }
  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }
  function onClick() {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    vibrate("tick");
    setSheetOpen(true);
  }

  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={onClick}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          aria-label={wellnessToolsEnabled ? "Neu anlegen (lang drücken: Stimmung)" : "Neu anlegen"}
          className={[
            "flex w-full items-center justify-center gap-2",
            "h-11 rounded-[0.875rem]",
            "bg-[color:var(--color-accent-600)] text-[color:white]",
            "shadow-[0 8px 24px oklch(54% 0.22 285 / 0.32)]",
            "transition-[background-color] duration-[140ms] ease-[cubic-bezier(0.2,0,0,1)]",
            "hover:bg-[color:var(--color-accent-700)] active:bg-[color:var(--color-accent-800)]",
          ].join(" ")}
        >
          <Plus size={18} aria-hidden />
          <span className="text-[length:0.9375rem] font-semibold">Neu</span>
        </button>
        <QuickCaptureSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={onClick}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        whileTap={{ scale: 0.92 }}
        aria-label="Neu anlegen (lang drücken: Stimmung)"
        className={[
          "inline-flex items-center justify-center",
          "h-14 w-14 -mt-3 rounded-full",
          "bg-gradient-to-br from-[color:var(--color-accent-500)] to-[color:var(--color-accent-700)]",
          "text-[color:white]",
          "shadow-[0 8px 24px oklch(54% 0.22 285 / 0.32)]",
          "transition-colors duration-[140ms]",
          "hover:brightness-110 active:brightness-95",
        ].join(" ")}
      >
        <Plus size={26} aria-hidden strokeWidth={2.4} />
      </motion.button>
      <QuickCaptureSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
