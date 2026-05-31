import { describe, expect, it } from "vitest";
import { dayKeyAddDays, dayKeyForDate, diffDays, lastNDayKeys } from "../dayKey";

describe("dayKey helpers", () => {
  it("formattiert ein Datum als YYYY-MM-DD", () => {
    expect(dayKeyForDate(new Date(2026, 4, 5))).toBe("2026-05-05");
  });

  it("addiert Tage und überspringt Monatsgrenzen", () => {
    expect(dayKeyAddDays("2026-01-30", 5)).toBe("2026-02-04");
    expect(dayKeyAddDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("berechnet Differenz in Tagen", () => {
    expect(diffDays("2026-05-10", "2026-05-05")).toBe(5);
    expect(diffDays("2026-01-01", "2025-12-30")).toBe(2);
  });

  it("liefert die letzten N Tageskeys aufsteigend", () => {
    const keys = lastNDayKeys(3, new Date(2026, 4, 5));
    expect(keys).toEqual(["2026-05-03", "2026-05-04", "2026-05-05"]);
  });
});
