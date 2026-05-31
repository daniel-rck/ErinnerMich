import { describe, expect, it } from "vitest";
import { nextYearlyOccurrence } from "../yearlyEngine";

describe("yearlyEngine", () => {
  it("liefert Geburtstag dieses Jahr wenn noch nicht vorbei", () => {
    const from = new Date("2026-05-01T00:00:00");
    const next = nextYearlyOccurrence({ type: "yearly", month: 7, day: 15, time: "09:00" }, from);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(6);
    expect(next.getDate()).toBe(15);
  });

  it("rollt aufs nächste Jahr", () => {
    const from = new Date("2026-08-01T00:00:00");
    const next = nextYearlyOccurrence({ type: "yearly", month: 7, day: 15, time: "09:00" }, from);
    expect(next.getFullYear()).toBe(2027);
  });

  it("zieht leadDays vom Ereignis ab", () => {
    const from = new Date("2026-01-01T00:00:00");
    const next = nextYearlyOccurrence(
      { type: "yearly", month: 1, day: 15, time: "09:00", leadDays: 3 },
      from,
    );
    expect(next.getMonth()).toBe(0); // Jan
    expect(next.getDate()).toBe(12); // 15. - 3 Tage
  });

  it("clampt 29.2. in Nicht-Schaltjahren auf 28.2.", () => {
    const from = new Date("2025-01-01T00:00:00");
    const next = nextYearlyOccurrence({ type: "yearly", month: 2, day: 29, time: "09:00" }, from);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });

  it("29.2. landet 2024 auf dem echten Schalttag", () => {
    const from = new Date("2024-01-01T00:00:00");
    const next = nextYearlyOccurrence({ type: "yearly", month: 2, day: 29, time: "09:00" }, from);
    expect(next.getDate()).toBe(29);
  });

  it("rollt auch mit leadDays über Jahresgrenze sauber", () => {
    const from = new Date("2026-12-30T00:00:00");
    const next = nextYearlyOccurrence(
      { type: "yearly", month: 1, day: 5, time: "09:00", leadDays: 3 },
      from,
    );
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(0);
    expect(next.getDate()).toBe(2);
  });
});
