import { describe, expect, it } from "vitest";
import { goalProblem, scheduleProblem } from "../validate";

describe("scheduleProblem", () => {
  it("rejects schedules that can never fire", () => {
    expect(scheduleProblem({ type: "daily", times: [] })).toMatch(/Uhrzeit/);
    expect(scheduleProblem({ type: "daily", times: ["08:00", ""] })).toMatch(/Wert/);
    expect(scheduleProblem({ type: "weekly", days: [], time: "09:00" })).toMatch(/Wochentag/);
    expect(scheduleProblem({ type: "monthly", dayOfMonth: 1, time: "" })).toMatch(/Uhrzeit/);
    expect(scheduleProblem({ type: "elapsed", days: 0 })).not.toBeNull();
    expect(scheduleProblem({ type: "interval", minutes: 0 })).not.toBeNull();
  });

  it("accepts valid schedules", () => {
    expect(scheduleProblem({ type: "daily", times: ["08:00", "20:00"] })).toBeNull();
    expect(scheduleProblem({ type: "weekly", days: ["MON"], time: "09:00" })).toBeNull();
    expect(scheduleProblem({ type: "elapsed", days: 7 })).toBeNull();
  });
});

describe("goalProblem", () => {
  it("needs a positive target and a unit", () => {
    expect(goalProblem({ type: "count", target: 0, unit: "Glas" })).not.toBeNull();
    expect(goalProblem({ type: "count", target: 8, unit: " " })).not.toBeNull();
    expect(goalProblem({ type: "duration", targetMinutes: 0 })).not.toBeNull();
    expect(goalProblem({ type: "count", target: 8, unit: "Glas" })).toBeNull();
    expect(goalProblem(undefined)).toBeNull();
  });
});
