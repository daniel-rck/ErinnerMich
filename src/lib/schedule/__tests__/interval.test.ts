import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { nextIntervalOccurrence } from "../intervalEngine";

describe("intervalEngine", () => {
  it("addiert minutes ohne activeWindow", () => {
    const from = new Date("2026-05-04T10:00:00");
    const next = nextIntervalOccurrence({ type: "interval", minutes: 90 }, from);
    expect(next.getTime() - from.getTime()).toBe(90 * 60_000);
  });

  it("snapt vor Fenster auf Fenster-Start", () => {
    const from = new Date("2026-05-04T06:00:00");
    const next = nextIntervalOccurrence(
      {
        type: "interval",
        minutes: 90,
        activeWindow: { start: "08:00", end: "20:00" },
      },
      from,
    );
    expect(next.getHours()).toBe(8);
    expect(next.getMinutes()).toBe(0);
  });

  it("addiert minutes innerhalb des Fensters", () => {
    const from = new Date("2026-05-04T12:00:00");
    const next = nextIntervalOccurrence(
      {
        type: "interval",
        minutes: 90,
        activeWindow: { start: "08:00", end: "20:00" },
      },
      from,
    );
    expect(next.getHours()).toBe(13);
    expect(next.getMinutes()).toBe(30);
  });

  it("rollt zum Folgetag wenn next nach Fenster-Ende", () => {
    const from = new Date("2026-05-04T19:30:00");
    const next = nextIntervalOccurrence(
      {
        type: "interval",
        minutes: 90,
        activeWindow: { start: "08:00", end: "20:00" },
      },
      from,
    );
    expect(next.getDate()).toBe(5);
    expect(next.getHours()).toBe(8);
  });

  it("verbietet activeWindow über Mitternacht", () => {
    expect(() =>
      nextIntervalOccurrence(
        {
          type: "interval",
          minutes: 60,
          activeWindow: { start: "22:00", end: "06:00" },
        },
        new Date("2026-05-04T22:30:00"),
      ),
    ).toThrow(/Mitternacht/);
  });

  it("verlangt minutes > 0", () => {
    expect(() => nextIntervalOccurrence({ type: "interval", minutes: 0 }, new Date())).toThrow(
      "interval.minutes muss > 0 sein",
    );
  });
});

describe("intervalEngine across DST", () => {
  beforeAll(() => {
    vi.stubEnv("TZ", "Europe/Berlin");
  });
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("jumps to the next calendar day's window on the day clocks go back", () => {
    // 2026-10-25: CEST → CET, the day has 25 hours.
    const from = new Date(2026, 9, 25, 22, 0);
    const next = nextIntervalOccurrence(
      { type: "interval", minutes: 90, activeWindow: { start: "08:00", end: "21:00" } },
      from,
    );
    expect(next.getDate()).toBe(26);
    expect(next.getHours()).toBe(8);
    expect(next.getTime()).toBeGreaterThan(from.getTime());
  });
});
