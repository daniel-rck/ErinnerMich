import { describe, expect, it } from "vitest";
import {
  adjustInventory,
  getInventory,
  listLowStock,
  refillInventory,
  setInventory,
} from "../inventories";

describe("inventory CRUD", () => {
  it("legt einen Inventar-Eintrag an und liest ihn zurück", async () => {
    await setInventory({
      reminderId: "r1",
      remaining: 14,
      unit: "Tabletten",
      refillThreshold: 5,
    });
    const got = await getInventory("r1");
    expect(got?.remaining).toBe(14);
    expect(got?.updatedAt).toBeGreaterThan(0);
  });

  it("dekrementiert über adjust und stoppt bei 0", async () => {
    await setInventory({
      reminderId: "r1",
      remaining: 2,
      unit: "St",
      refillThreshold: 1,
    });
    const after1 = await adjustInventory("r1", -1);
    expect(after1?.remaining).toBe(1);
    const after2 = await adjustInventory("r1", -5);
    expect(after2?.remaining).toBe(0);
  });

  it("refillt und setzt lastRefillAt", async () => {
    await setInventory({
      reminderId: "r1",
      remaining: 0,
      unit: "St",
      refillThreshold: 2,
    });
    const refilled = await refillInventory("r1", 30);
    expect(refilled?.remaining).toBe(30);
    expect(refilled?.lastRefillAt).toBeGreaterThan(0);
  });

  it("listet nur Inventories mit remaining <= refillThreshold", async () => {
    await setInventory({
      reminderId: "low",
      remaining: 1,
      unit: "St",
      refillThreshold: 5,
    });
    await setInventory({
      reminderId: "ok",
      remaining: 100,
      unit: "St",
      refillThreshold: 5,
    });
    await setInventory({
      reminderId: "edge",
      remaining: 5,
      unit: "St",
      refillThreshold: 5,
    });

    const low = await listLowStock();
    const ids = low.map((i) => i.reminderId).sort();
    expect(ids).toEqual(["edge", "low"]);
  });
});
