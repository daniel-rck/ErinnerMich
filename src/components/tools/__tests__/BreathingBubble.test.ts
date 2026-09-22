import { describe, expect, it } from "vitest";
import { phaseAt } from "../BreathingBubble";

const steps = [
  { phase: "in" as const, seconds: 4, label: "Einatmen" },
  { phase: "hold" as const, seconds: 7, label: "Halten" },
  { phase: "out" as const, seconds: 8, label: "Ausatmen" },
];

describe("phaseAt", () => {
  it("maps elapsed seconds onto the 4-7-8 cycle", () => {
    expect(phaseAt(steps, 0)).toEqual({ stepIndex: 0, phaseElapsed: 0 });
    expect(phaseAt(steps, 5)).toEqual({ stepIndex: 1, phaseElapsed: 1 });
    expect(phaseAt(steps, 12)).toEqual({ stepIndex: 2, phaseElapsed: 1 });
  });

  it("wraps into the next cycle", () => {
    expect(phaseAt(steps, 19 + 2)).toEqual({ stepIndex: 0, phaseElapsed: 2 });
  });
});
