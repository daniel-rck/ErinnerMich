import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { addToolEntry } from "../../lib/db/toolEntries";
import { useToast } from "../ui/Toast";

type Mode = "4-7-8" | "box";
type Phase = "in" | "hold" | "out" | "hold2";

interface PhaseStep {
  phase: Phase;
  seconds: number;
  label: string;
}

const PHASES: Record<Mode, PhaseStep[]> = {
  "4-7-8": [
    { phase: "in", seconds: 4, label: "Einatmen" },
    { phase: "hold", seconds: 7, label: "Halten" },
    { phase: "out", seconds: 8, label: "Ausatmen" },
  ],
  box: [
    { phase: "in", seconds: 4, label: "Einatmen" },
    { phase: "hold", seconds: 4, label: "Halten" },
    { phase: "out", seconds: 4, label: "Ausatmen" },
    { phase: "hold2", seconds: 4, label: "Halten" },
  ],
};

const TOTAL_SECONDS = 60;

/** Which phase `elapsedSec` of active breathing falls into, and how far into it. */
export function phaseAt(
  steps: readonly PhaseStep[],
  elapsedSec: number,
): { stepIndex: number; phaseElapsed: number } {
  const cycle = steps.reduce((acc, s) => acc + s.seconds, 0);
  let t = cycle > 0 ? elapsedSec % cycle : 0;
  for (let i = 0; i < steps.length; i++) {
    const seconds = steps[i]?.seconds ?? 0;
    if (t < seconds) return { stepIndex: i, phaseElapsed: t };
    t -= seconds;
  }
  return { stepIndex: 0, phaseElapsed: 0 };
}

export function BreathingBubble() {
  const [mode, setMode] = useState<Mode>("4-7-8");
  const [running, setRunning] = useState(false);
  // Active (unpaused) seconds. The phase is derived from it rather than
  // stepped inside state updaters — those ran twice under Strict Mode and
  // skipped phases, and a 100 ms interval rebuilt per phase drifted.
  const [totalElapsed, setTotalElapsed] = useState(0);
  const finishingRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const toast = useToast();

  const steps = PHASES[mode];
  const { stepIndex, phaseElapsed } = phaseAt(steps, totalElapsed);
  const currentStep = totalElapsed > 0 || running ? steps[stepIndex] : undefined;
  const phaseProgress = currentStep ? Math.min(1, phaseElapsed / currentStep.seconds) : 0;
  const totalRemaining = Math.max(0, TOTAL_SECONDS - totalElapsed);

  const scale = useMemo(() => {
    if (!currentStep) return 0.6;
    if (currentStep.phase === "in") return 0.6 + 0.4 * phaseProgress;
    if (currentStep.phase === "out") return 1 - 0.4 * phaseProgress;
    return currentStep.phase === "hold" ? 1 : 0.6;
  }, [currentStep, phaseProgress]);

  useEffect(() => {
    if (!running) return;
    const base = totalElapsed;
    const startedAt = performance.now();
    const id = window.setInterval(() => {
      setTotalElapsed(Math.min(TOTAL_SECONDS, base + (performance.now() - startedAt) / 1000));
    }, 100);
    return () => window.clearInterval(id);
    // Restart only on run/pause — `totalElapsed` is the base captured at start.
    // oxlint-disable-next-line react/exhaustive-deps -- see above
  }, [running]);

  useEffect(() => {
    if (running && totalElapsed >= TOTAL_SECONDS && !finishingRef.current) {
      finishingRef.current = true;
      void finish();
    }
    // oxlint-disable-next-line react/exhaustive-deps -- `finish` is stable enough; re-run on time only
  }, [running, totalElapsed]);

  function start() {
    finishingRef.current = false;
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setTotalElapsed(0);
    finishingRef.current = false;
  }

  async function finish() {
    setRunning(false);
    // The active time — the same clock as "Restzeit", so the saved duration
    // matches what the screen showed even if the tab was throttled.
    const durationSec = Math.round(totalElapsed);
    if (durationSec < 1) {
      finishingRef.current = false;
      return;
    }
    try {
      await addToolEntry({
        toolKey: "breathing",
        loggedAt: Date.now(),
        durationSec,
      });
      toast.show({
        variant: "success",
        message: `Atemübung abgeschlossen (${durationSec} s).`,
      });
    } catch {
      toast.show({
        variant: "error",
        message: "Konnte Atemübung nicht speichern.",
      });
    }
    reset();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        <ModeButton active={mode === "4-7-8"} onClick={() => !running && setMode("4-7-8")}>
          4-7-8
        </ModeButton>
        <ModeButton active={mode === "box"} onClick={() => !running && setMode("box")}>
          Box-Atmung
        </ModeButton>
      </div>

      <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-200 to-cyan-300 dark:from-sky-700 dark:to-cyan-600"
          animate={reducedMotion ? { scale: 0.8 } : { scale }}
          transition={{ duration: 0.1, ease: "linear" }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col items-center gap-1 text-center">
          {/* Announced on each phase change — the bubble itself is silent. */}
          <span className="text-xl font-semibold text-sky-950 dark:text-sky-50" aria-live="polite">
            {currentStep?.label ?? "Bereit"}
          </span>
          <span
            className="text-3xl font-bold tabular-nums text-sky-950 dark:text-sky-50"
            aria-hidden
          >
            {Math.max(0, Math.ceil((currentStep?.seconds ?? 0) - phaseElapsed))}
          </span>
        </div>
      </div>

      <div className="text-sm text-fg-muted tabular-nums">
        Restzeit: {Math.ceil(totalRemaining)}s
      </div>

      <div className="flex gap-2">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-fg-on-accent hover:bg-sky-800"
          >
            <Play size={16} aria-hidden /> Start
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="inline-flex items-center gap-2 rounded-md bg-surface-sunken px-4 py-2 text-sm font-medium text-fg hover:bg-border"
          >
            <Pause size={16} aria-hidden /> Pause
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-sunken"
        >
          <RotateCcw size={16} aria-hidden /> Neu starten
        </button>
        <button
          type="button"
          onClick={() => void finish()}
          disabled={totalElapsed < 1}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-sunken disabled:opacity-50"
        >
          Fertig
        </button>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-md border px-3 py-1.5 text-sm " +
        (active
          ? "border-sky-500 bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
          : "border-border hover:bg-surface-sunken")
      }
    >
      {children}
    </button>
  );
}
