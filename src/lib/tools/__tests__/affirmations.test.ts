import { describe, expect, it } from "vitest";
import { AFFIRMATIONS, affirmationForDay, getAffirmationById } from "../affirmations";

describe("affirmations", () => {
  it("liefert dieselbe Affirmation für denselben Tag", () => {
    const a = affirmationForDay("2026-05-06");
    const b = affirmationForDay("2026-05-06");
    expect(a.id).toBe(b.id);
  });

  it("ist deterministisch über Tage hinweg", () => {
    const day = "2026-01-15";
    const first = affirmationForDay(day);
    const second = affirmationForDay(day);
    const third = affirmationForDay(day);
    expect(first.id).toBe(second.id);
    expect(second.id).toBe(third.id);
  });

  it("liefert für unterschiedliche Tage in Summe Variation", () => {
    const ids = new Set<string>();
    for (let d = 1; d <= 30; d++) {
      const day = `2026-03-${String(d).padStart(2, "0")}`;
      ids.add(affirmationForDay(day).id);
    }
    expect(ids.size).toBeGreaterThan(5);
  });

  it("gibt eine gültige Affirmation aus dem Pool zurück", () => {
    const a = affirmationForDay("2026-12-31");
    const found = AFFIRMATIONS.find((x) => x.id === a.id);
    expect(found).toBeDefined();
    expect(a.text.length).toBeGreaterThan(0);
  });

  it("findet Affirmationen per ID", () => {
    expect(getAffirmationById("a01")?.id).toBe("a01");
    expect(getAffirmationById("nonexistent")).toBeUndefined();
  });
});
