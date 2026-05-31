import { readSettings } from "../../lib/db/settings";

export type HapticPattern = "tick" | "success" | "milestone" | "warning" | "long";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tick: 12,
  success: 50,
  milestone: [40, 60, 40, 60, 80],
  warning: [20, 30, 20],
  long: 200,
};

export function vibrate(pattern: HapticPattern): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (!readSettings().hapticsEnabled) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* no-op */
  }
}
