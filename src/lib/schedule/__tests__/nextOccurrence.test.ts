import { describe, expect, it } from "vitest";
import { nextNOccurrences, nextOccurrence } from "../nextOccurrence";

describe("nextOccurrence Fassade", () => {
  it("returnt null für inventory_based", () => {
    expect(nextOccurrence({ type: "inventory_based" }, new Date())).toBeNull();
  });

  it("dispatcht zu daily", () => {
    const next = nextOccurrence(
      { type: "daily", times: ["08:00", "20:00"] },
      new Date("2026-05-04T07:00:00"),
    );
    expect(next!.getHours()).toBe(8);
  });

  it("Idempotenz: nextOccurrence(s, next) > next selbst", () => {
    const schedule = { type: "daily" as const, times: ["08:00", "20:00"] };
    const t0 = new Date("2026-05-04T07:00:00");
    const t1 = nextOccurrence(schedule, t0)!;
    const t2 = nextOccurrence(schedule, t1)!;
    expect(t2.getTime()).toBeGreaterThan(t1.getTime());
  });
});

describe("nextNOccurrences", () => {
  it("liefert n aufsteigende Termine für interval", () => {
    const occs = nextNOccurrences(
      { type: "interval", minutes: 60 },
      new Date("2026-05-04T08:00:00"),
      5,
    );
    expect(occs).toHaveLength(5);
    for (let i = 1; i < occs.length; i++) {
      expect(occs[i]!.getTime()).toBeGreaterThan(occs[i - 1]!.getTime());
    }
  });

  it("bricht bei expires-schedule wenn Ablauf passiert", () => {
    const expiresAt = new Date("2026-05-10T10:00:00").getTime();
    const occs = nextNOccurrences(
      {
        type: "expires",
        expiresAt,
        preWarnings: [{ kind: "days", value: 1 }],
      },
      new Date("2026-05-04T08:00:00"),
      10,
    );
    expect(occs.length).toBeLessThanOrEqual(2); // 1d-Warnung + Ablauf
  });

  it("liefert leeres Array für inventory_based", () => {
    expect(nextNOccurrences({ type: "inventory_based" }, new Date(), 5)).toEqual([]);
  });

  it("respektiert n=0", () => {
    expect(nextNOccurrences({ type: "daily", times: ["08:00"] }, new Date(), 0)).toEqual([]);
  });

  it("produziert für yearly+leadDays sinnvolle Reihenfolge", () => {
    const occs = nextNOccurrences(
      { type: "yearly", month: 1, day: 15, time: "09:00", leadDays: 3 },
      new Date("2026-01-01T00:00:00"),
      3,
    );
    expect(occs).toHaveLength(3);
    for (let i = 1; i < occs.length; i++) {
      expect(occs[i]!.getFullYear()).toBeGreaterThan(occs[i - 1]!.getFullYear());
    }
  });
});
