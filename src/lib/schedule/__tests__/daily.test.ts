import { describe, expect, it } from "vitest";
import { nextDailyOccurrence } from "../dailyEngine";

describe("dailyEngine", () => {
  it("liefert nächsten Time-Slot heute", () => {
    const from = new Date("2026-05-04T07:00:00");
    const next = nextDailyOccurrence({ type: "daily", times: ["08:00", "20:00"] }, from);
    expect(next.getHours()).toBe(8);
    expect(next.getDate()).toBe(4);
  });

  it("rollt auf morgen wenn alle Slots vorbei", () => {
    const from = new Date("2026-05-04T21:00:00");
    const next = nextDailyOccurrence({ type: "daily", times: ["08:00", "20:00"] }, from);
    expect(next.getHours()).toBe(8);
    expect(next.getDate()).toBe(5);
  });

  it("sortiert times intern", () => {
    const from = new Date("2026-05-04T10:00:00");
    const next = nextDailyOccurrence({ type: "daily", times: ["20:00", "12:00", "08:00"] }, from);
    expect(next.getHours()).toBe(12);
  });

  it("nimmt nächsten Slot, nicht den jetzigen Zeitpunkt", () => {
    const from = new Date("2026-05-04T08:00:00");
    const next = nextDailyOccurrence({ type: "daily", times: ["08:00", "20:00"] }, from);
    expect(next.getHours()).toBe(20);
  });

  it("verlangt nicht-leeres times-Array", () => {
    expect(() => nextDailyOccurrence({ type: "daily", times: [] }, new Date())).toThrow();
  });
});
