import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Modal } from "./ui/Modal";

interface CelebrationProps {
  open: boolean;
  streak: number;
  onClose: () => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fireConfetti() {
  if (prefersReducedMotion()) return;
  const colors = ["#7c3aed", "#a78bfa", "#c4b5fd", "#fbbf24"];
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.5 },
    colors,
  });
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 90,
      origin: { y: 0.6, x: 0.3 },
      colors,
    });
    confetti({
      particleCount: 50,
      spread: 90,
      origin: { y: 0.6, x: 0.7 },
      colors,
    });
  }, 200);
}

export function Celebration({ open, streak, onClose }: CelebrationProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the dismiss button when the celebration opens. Done in an effect
  // rather than with autoFocus: the attribute steals focus whenever the node
  // mounts, regardless of why, which is disorienting with a screen reader.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} hideClose size="sm">
      <AnimatePresence>
        {open && (
          <motion.div
            key="content"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="flex flex-col items-center gap-3 py-4 text-center"
          >
            <span className="text-6xl" aria-hidden>
              🎉
            </span>
            <h2 className="text-2xl font-semibold">{streak} Tage in Folge!</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{messageForStreak(streak)}</p>
            <button
              type="button"
              onClick={onClose}
              ref={closeRef}
              className="mt-2 rounded-md bg-accent-600 px-5 py-2 text-sm font-medium text-white hover:bg-accent-700"
            >
              Weiter so
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function messageForStreak(streak: number): string {
  if (streak >= 365) return "Ein ganzes Jahr. Das ist außergewöhnlich.";
  if (streak >= 100) return "Hundert Tage. Mit weniger gibt sich keiner zufrieden.";
  if (streak >= 30) return "Ein Monat ohne Lücke. Das ist solide.";
  return "Eine Woche dran geblieben. Stark.";
}
