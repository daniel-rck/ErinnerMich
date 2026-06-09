import { describe, expect, it, vi } from "vitest";
import { broadcast } from "../../db/broadcast";
import { addEvent, listEventsForReminder } from "../../db/events";
import { getInventory, setInventory } from "../../db/inventories";
import { addMoodEntry, listMoodEntriesInRange } from "../../db/moodEntries";
import { createReminder, listReminders } from "../../db/reminders";
import { addToolEntry, listToolEntries } from "../../db/toolEntries";
import {
  EXPORT_SCHEMA_VERSION,
  exportAll,
  exportFilename,
  ImportSchemaError,
  importAll,
  parseExport,
} from "../exportImport";

vi.mock("../../db/broadcast", () => ({
  broadcast: vi.fn(),
  subscribe: () => () => {},
}));

async function seed() {
  const reminder = await createReminder({
    kind: "reminder",
    title: "Pflanze gießen",
    icon: "🪴",
    category: "plant",
    color: "green",
    schedule: { type: "elapsed", days: 5 },
    streakSensitive: false,
    active: true,
  });
  await addEvent({
    reminderId: reminder.id,
    action: "completed",
    triggeredAt: 1700000000000,
  });
  await setInventory({
    reminderId: reminder.id,
    remaining: 10,
    unit: "L",
    refillThreshold: 2,
  });
  await addMoodEntry({ loggedAt: 1700000000000, mood: 4 });
  await addToolEntry({
    toolKey: "gratitude",
    loggedAt: 1700000000000,
    text: "Sonne heute",
  });
  return reminder;
}

describe("exportAll", () => {
  it("liefert ein vollständiges Snapshot ohne interne Day-Felder", async () => {
    const reminder = await seed();
    const snap = await exportAll();
    expect(snap.schema).toBe("erinnermich");
    expect(snap.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(snap.reminders).toHaveLength(1);
    expect(snap.reminders[0].id).toBe(reminder.id);
    expect(snap.events).toHaveLength(1);
    expect(Object.hasOwn(snap.events[0], "triggeredAtDay")).toBe(false);
    expect(snap.inventories).toHaveLength(1);
    expect(snap.moodEntries).toHaveLength(1);
    expect(Object.hasOwn(snap.moodEntries[0], "loggedAtDay")).toBe(false);
    expect(snap.toolEntries).toHaveLength(1);
    expect(snap.toolEntries[0].text).toBe("Sonne heute");
    expect(Object.hasOwn(snap.toolEntries[0], "loggedAtDay")).toBe(false);
  });
});

describe("parseExport", () => {
  it("akzeptiert ein valides Snapshot", () => {
    const valid = {
      schema: "erinnermich",
      schemaVersion: 1,
      exportedAt: 0,
      reminders: [],
      events: [],
      inventories: [],
      moodEntries: [],
    };
    expect(parseExport(valid).schema).toBe("erinnermich");
  });

  it("lehnt fremde Schemas ab", () => {
    expect(() => parseExport({ schema: "other", schemaVersion: 1 })).toThrow(ImportSchemaError);
  });

  it("lehnt zu hohe schemaVersion ab", () => {
    expect(() => parseExport({ schema: "erinnermich", schemaVersion: 999 })).toThrow(
      ImportSchemaError,
    );
  });

  it("lehnt fehlende Arrays ab", () => {
    expect(() =>
      parseExport({
        schema: "erinnermich",
        schemaVersion: 1,
        reminders: [],
        events: "nope",
        inventories: [],
        moodEntries: [],
      }),
    ).toThrow(ImportSchemaError);
  });

  it("akzeptiert v1-Exporte ohne toolEntries und defaultet auf []", () => {
    const v1 = {
      schema: "erinnermich",
      schemaVersion: 1,
      exportedAt: 0,
      reminders: [],
      events: [],
      inventories: [],
      moodEntries: [],
    };
    const parsed = parseExport(v1);
    expect(parsed.toolEntries).toEqual([]);
  });

  it("lehnt nicht-Array toolEntries ab", () => {
    expect(() =>
      parseExport({
        schema: "erinnermich",
        schemaVersion: 2,
        reminders: [],
        events: [],
        inventories: [],
        moodEntries: [],
        toolEntries: "nope",
      }),
    ).toThrow(ImportSchemaError);
  });
});

describe("importAll roundtrip", () => {
  it("replace-Modus stellt ein Snapshot 1:1 wieder her", async () => {
    const reminder = await seed();
    const snap = await exportAll();

    // wipe
    await importAll(
      {
        ...snap,
        reminders: [],
        events: [],
        inventories: [],
        moodEntries: [],
        toolEntries: [],
      },
      { mode: "replace" },
    );
    expect(await listReminders()).toHaveLength(0);
    expect(await listToolEntries()).toHaveLength(0);

    // restore
    const summary = await importAll(snap, { mode: "replace" });
    expect(summary).toEqual({
      reminders: 1,
      events: 1,
      inventories: 1,
      moodEntries: 1,
      toolEntries: 1,
    });
    const restored = await listReminders();
    expect(restored[0].id).toBe(reminder.id);
    expect(await listEventsForReminder(reminder.id)).toHaveLength(1);
    expect((await getInventory(reminder.id))?.remaining).toBe(10);
    expect(await listMoodEntriesInRange(0, Date.now())).toHaveLength(1);
    const tools = await listToolEntries();
    expect(tools).toHaveLength(1);
    expect(tools[0].text).toBe("Sonne heute");
  });

  it("merge-Modus überschreibt nur überlappende IDs", async () => {
    await seed();
    const reminder2 = await createReminder({
      kind: "reminder",
      title: "Kaffee",
      icon: "☕",
      category: "other",
      color: "amber",
      schedule: { type: "daily", times: ["08:00"] },
      streakSensitive: false,
      active: true,
    });
    const snap = await exportAll();
    expect(snap.reminders).toHaveLength(2);

    // delete reminder2 only
    const rem1 = (await listReminders()).find((r) => r.id !== reminder2.id)!;
    await importAll(
      {
        ...snap,
        reminders: [rem1],
      },
      { mode: "replace" },
    );
    expect(await listReminders()).toHaveLength(1);

    // re-import full snapshot in merge mode → reminder2 reappears
    await importAll(snap, { mode: "merge" });
    const after = await listReminders();
    expect(after.map((r) => r.id).sort()).toEqual([reminder2.id, rem1.id].sort());
  });

  it("broadcastet db-cleared auch im Merge-Modus (Hooks laden neu)", async () => {
    await seed();
    const snap = await exportAll();
    vi.mocked(broadcast).mockClear();
    await importAll(snap, { mode: "merge" });
    expect(vi.mocked(broadcast)).toHaveBeenCalledWith({ type: "db-cleared" });
  });
});

describe("exportFilename", () => {
  it("verwendet ISO-Datum im Dateinamen", () => {
    expect(exportFilename(new Date(2026, 4, 5))).toBe("erinnermich-2026-05-05.json");
  });
});
