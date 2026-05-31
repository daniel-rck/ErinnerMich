import { describe, expect, it } from "vitest";
import { daysUntilExpiry, listExpiresTriggers, nextExpiresOccurrence } from "../expiresEngine";

describe("expiresEngine", () => {
  const expiresAt = new Date("2027-06-15T09:00:00").getTime();
  const schedule = {
    type: "expires" as const,
    expiresAt,
    preWarnings: [
      { kind: "years" as const, value: 1 },
      { kind: "months" as const, value: 6 },
      { kind: "months" as const, value: 3 },
      { kind: "months" as const, value: 1 },
      { kind: "days" as const, value: 7 },
      { kind: "days" as const, value: 1 },
    ],
  };

  it("liefert die nächste Pre-Warning sortiert", () => {
    const from = new Date("2026-01-01T00:00:00");
    const next = nextExpiresOccurrence(schedule, from);
    expect(next).not.toBeNull();
    // 1y vor 15.06.2027 → 15.06.2026
    expect(next!.getFullYear()).toBe(2026);
    expect(next!.getMonth()).toBe(5);
    expect(next!.getDate()).toBe(15);
  });

  it("überspringt vergangene Pre-Warnings", () => {
    const from = new Date("2027-06-10T00:00:00");
    const next = nextExpiresOccurrence(schedule, from);
    // Übrig: nur 1d-Warnung (14.06.) und Ablauf (15.06.)
    expect(next!.getDate()).toBe(14);
  });

  it("returnt null wenn Ablauf vorbei", () => {
    const from = new Date("2028-01-01T00:00:00");
    expect(nextExpiresOccurrence(schedule, from)).toBeNull();
  });

  it("listet alle künftigen Trigger inkl. expiresAt", () => {
    const from = new Date("2026-01-01T00:00:00");
    const triggers = listExpiresTriggers(schedule, from);
    expect(triggers.length).toBe(7); // 6 PreWarnings + expiresAt
    expect(triggers[triggers.length - 1].getTime()).toBe(expiresAt);
  });

  it("berechnet daysUntilExpiry positiv und negativ", () => {
    expect(daysUntilExpiry(schedule, new Date(expiresAt - 24 * 60 * 60 * 1000))).toBe(1);
    expect(
      daysUntilExpiry(schedule, new Date(expiresAt + 2 * 24 * 60 * 60 * 1000)),
    ).toBeLessThanOrEqual(-1);
  });
});
