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

export function BreathingBubble() {
  const [mode, setMode] = useState<Mode>("4-7-8");
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const sessionStartRef = useRef<number | null>(null);
  const finishingRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const toast = useToast();

  const steps = PHASES[mode];
  const currentStep = steps[stepIndex];
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
    const id = window.setInterval(() => {
      setPhaseElapsed((p) => {
        const next = p + 0.1;
        const seconds = steps[stepIndex]?.seconds ?? 0;
        if (next >= seconds) {
          setStepIndex((idx) => (idx + 1) % steps.length);
          return 0;
        }
        return next;
      });
      setTotalElapsed((t) => {
        const next = t + 0.1;
        if (next >= TOTAL_SECONDS && !finishingRef.current) {
          finishingRef.current = true;
          void finish();
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stepIndex, steps]);

  function start() {
    sessionStartRef.current = Date.now();
    finishingRef.current = false;
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setStepIndex(0);
    setPhaseElapsed(0);
    setTotalElapsed(0);
    sessionStartRef.current = null;
    finishingRef.current = false;
  }

  async function finish() {
    setRunning(false);
    const start = sessionStartRef.current;
    if (!start) {
      finishingRef.current = false;
      return;
    }
    const durationSec = Math.round((Date.now() - start) / 1000);
    sessionStartRef.current = null;
    try {
      await addToolEntry({
        toolKey: "breathing",
        loggedAt: Date.now(),
        durationSec,
      });
      toast.show({
        variant: "success",
        message: `Atemübung abgeschlossen (${durationSec}s).`,
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
          <span className="text-xl font-semibold text-sky-950 dark:text-sky-50">
            {currentStep?.label ?? "Bereit"}
          </span>
          <span className="text-3xl font-bold tabular-nums text-sky-950 dark:text-sky-50">
            {Math.max(0, Math.ceil((currentStep?.seconds ?? 0) - phaseElapsed))}
          </span>
        </div>
      </div>

      <div className="text-sm text-zinc-500 tabular-nums dark:text-zinc-400">
        Restzeit: {Math.ceil(totalRemaining)}s
      </div>

      <div className="flex gap-2">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            <Play size={16} /> Start
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <Pause size={16} /> Pause
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <RotateCcw size={16} /> Reset
        </button>
        <button
          type="button"
          onClick={() => void finish()}
          disabled={totalElapsed < 1}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
      className={
        "rounded-md border px-3 py-1.5 text-sm " +
        (active
          ? "border-sky-500 bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800")
      }
    >
      {children}
    </button>
  );
}
