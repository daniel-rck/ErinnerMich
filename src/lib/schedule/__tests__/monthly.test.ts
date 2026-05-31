import { describe, expect, it } from "vitest";
import { nextMonthlyOccurrence } from "../monthlyEngine";

describe("monthlyEngine", () => {
  it("liefert dayOfMonth diesen Monat wenn noch in Zukunft", () => {
    const from = new Date("2026-05-01T08:00:00");
    const next = nextMonthlyOccurrence({ type: "monthly", dayOfMonth: 15, time: "09:00" }, from);
    expect(next.getDate()).toBe(15);
    expect(next.getMonth()).toBe(4); // May
  });

  it("rollt auf Folgemonat wenn Tag schon vorbei", () => {
    const from = new Date("2026-05-20T08:00:00");
    const next = nextMonthlyOccurrence({ type: "monthly", dayOfMonth: 15, time: "09:00" }, from);
    expect(next.getMonth()).toBe(5); // June
    expect(next.getDate()).toBe(15);
  });

  it("clampt dayOfMonth=31 in Februar auf 28 (Nicht-Schaltjahr)", () => {
    const from = new Date("2025-02-01T00:00:00");
    const next = nextMonthlyOccurrence({ type: "monthly", dayOfMonth: 31, time: "09:00" }, from);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(28);
  });

  it("clampt dayOfMonth=31 in Februar auf 29 (Schaltjahr)", () => {
    const from = new Date("2024-02-01T00:00:00");
    const next = nextMonthlyOccurrence({ type: "monthly", dayOfMonth: 31, time: "09:00" }, from);
    expect(next.getDate()).toBe(29);
  });

  it("clampt dayOfMonth=31 in April auf 30", () => {
    const from = new Date("2026-04-01T00:00:00");
    const next = nextMonthlyOccurrence({ type: "monthly", dayOfMonth: 31, time: "09:00" }, from);
    expect(next.getMonth()).toBe(3);
    expect(next.getDate()).toBe(30);
  });

  it("lehnt ungültigen dayOfMonth ab", () => {
    expect(() =>
      nextMonthlyOccurrence({ type: "monthly", dayOfMonth: 32, time: "09:00" }, new Date()),
    ).toThrow();
  });
});
