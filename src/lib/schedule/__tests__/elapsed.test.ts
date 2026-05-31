import { describe, expect, it } from "vitest";
import { nextElapsedOccurrence } from "../elapsedEngine";

const DAY = 24 * 60 * 60 * 1000;

describe("elapsedEngine", () => {
  it("zählt vom lastDone aus", () => {
    const lastDone = new Date("2026-05-01T10:00:00").getTime();
    const next = nextElapsedOccurrence(
      { type: "elapsed", days: 5, lastDone },
      new Date("2026-05-04T08:00:00"),
    );
    expect(next.getTime() - lastDone).toBe(5 * DAY);
  });

  it("liefert vergangenen Termin (überfällig) wenn lastDone alt ist", () => {
    const lastDone = new Date("2026-04-01T10:00:00").getTime();
    const next = nextElapsedOccurrence(
      { type: "elapsed", days: 5, lastDone },
      new Date("2026-05-04T08:00:00"),
    );
    expect(next.getTime()).toBeLessThan(Date.parse("2026-05-04T08:00:00"));
  });

  it("ankert ohne lastDone an from", () => {
    const from = new Date("2026-05-04T08:00:00");
    const next = nextElapsedOccurrence({ type: "elapsed", days: 7 }, from);
    expect(next.getTime() - from.getTime()).toBe(7 * DAY);
  });

  it("lehnt days <= 0 ab", () => {
    expect(() => nextElapsedOccurrence({ type: "elapsed", days: 0 }, new Date())).toThrow();
  });
});
