import { describe, expect, it } from "vitest";
import { formatRelativeDate, formatSchedule } from "../format";

describe("formatSchedule", () => {
  it("beschreibt interval mit activeWindow", () => {
    expect(
      formatSchedule({
        type: "interval",
        minutes: 90,
        activeWindow: { start: "08:00", end: "20:00" },
      }),
    ).toBe("Alle 90 min (08:00–20:00)");
  });

  it("beschreibt daily", () => {
    expect(formatSchedule({ type: "daily", times: ["20:00", "08:00"] })).toContain("08:00");
  });

  it("beschreibt weekly", () => {
    expect(formatSchedule({ type: "weekly", days: ["MON", "FRI"], time: "19:00" })).toBe(
      "Mo / Fr um 19:00",
    );
  });

  it("beschreibt biweekly mit Parität", () => {
    const result = formatSchedule({
      type: "biweekly",
      days: ["TUE"],
      time: "08:00",
      weekParity: "even",
    });
    expect(result).toContain("gerade");
  });

  it("beschreibt yearly mit leadDays", () => {
    expect(
      formatSchedule({
        type: "yearly",
        month: 1,
        day: 15,
        time: "09:00",
        leadDays: 3,
      }),
    ).toContain("3 Tage");
  });

  it("beschreibt inventory_based", () => {
    expect(formatSchedule({ type: "inventory_based" })).toBe("Wenn Bestand niedrig");
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2026-05-04T12:00:00");
  it("heute", () => {
    expect(formatRelativeDate(new Date("2026-05-04T08:00:00"), now)).toBe("heute");
  });
  it("morgen", () => {
    expect(formatRelativeDate(new Date("2026-05-05T08:00:00"), now)).toBe("morgen");
  });
  it("in 5 Tagen", () => {
    expect(formatRelativeDate(new Date("2026-05-09T12:00:00"), now)).toBe("in 5 Tagen");
  });
});
