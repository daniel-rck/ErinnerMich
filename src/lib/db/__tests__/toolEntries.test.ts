import { describe, expect, it } from "vitest";
import { dayKey } from "..";
import {
  addToolEntry,
  deleteToolEntry,
  listToolEntries,
  listToolEntriesForDay,
  sweepExpiredToolEntries,
} from "../toolEntries";

describe("tool entries", () => {
  it("legt einen ToolEntry an und liest ihn nach toolKey", async () => {
    const t = new Date("2026-05-04T10:00:00Z").getTime();
    await addToolEntry({ toolKey: "breathing", loggedAt: t, durationSec: 60 });
    const list = await listToolEntries({ toolKey: "breathing" });
    expect(list).toHaveLength(1);
    expect(list[0]!.durationSec).toBe(60);
  });

  it("filtert nach toolKey und Tag", async () => {
    const t = new Date("2026-05-04T10:00:00Z").getTime();
    await addToolEntry({ toolKey: "gratitude", loggedAt: t, text: "Sonne" });
    await addToolEntry({ toolKey: "worry", loggedAt: t, text: "Termin" });
    const day = await listToolEntriesForDay("gratitude", dayKey(t));
    expect(day).toHaveLength(1);
    expect(day[0]!.text).toBe("Sonne");
  });

  it("löscht einen Eintrag", async () => {
    const t = Date.now();
    const created = await addToolEntry({
      toolKey: "affirmation",
      loggedAt: t,
      affirmationId: "a01",
    });
    await deleteToolEntry(created.id);
    const list = await listToolEntries({ toolKey: "affirmation" });
    expect(list).toHaveLength(0);
  });

  it("sweept abgelaufene Worry-Einträge", async () => {
    const now = new Date("2026-05-04T10:00:00Z").getTime();
    const past = now - 60_000;
    const future = now + 60_000;
    await addToolEntry({
      toolKey: "worry",
      loggedAt: past - 1000,
      text: "alt",
      expiresAt: past,
    });
    await addToolEntry({
      toolKey: "worry",
      loggedAt: now,
      text: "aktuell",
      expiresAt: future,
    });
    await addToolEntry({
      toolKey: "worry",
      loggedAt: now,
      text: "unbegrenzt",
    });

    const removed = await sweepExpiredToolEntries(now);
    expect(removed).toBe(1);

    const remaining = await listToolEntries({ toolKey: "worry" });
    expect(remaining).toHaveLength(2);
    expect(remaining.map((e) => e.text).sort()).toEqual(["aktuell", "unbegrenzt"]);
  });

  it("filtert per Zeitbereich", async () => {
    const a = new Date("2026-05-01T08:00:00Z").getTime();
    const b = new Date("2026-05-03T08:00:00Z").getTime();
    const c = new Date("2026-05-10T08:00:00Z").getTime();
    await addToolEntry({ toolKey: "gratitude", loggedAt: a, text: "a" });
    await addToolEntry({ toolKey: "gratitude", loggedAt: b, text: "b" });
    await addToolEntry({ toolKey: "gratitude", loggedAt: c, text: "c" });

    const range = await listToolEntries({ since: a, until: b });
    expect(range.map((e) => e.text)).toEqual(["b", "a"]);
  });
});
