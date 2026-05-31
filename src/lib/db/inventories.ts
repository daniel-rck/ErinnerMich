import type { Inventory } from "../types";
import { broadcast } from "./broadcast";
import { getDB } from "./index";

export type NewInventory = Omit<Inventory, "updatedAt">;

export async function setInventory(input: NewInventory): Promise<Inventory> {
  const inventory: Inventory = { ...input, updatedAt: Date.now() };
  const db = await getDB();
  await db.put("inventories", inventory);
  broadcast({ type: "inventory-changed", reminderId: inventory.reminderId });
  return inventory;
}

export async function getInventory(reminderId: string): Promise<Inventory | undefined> {
  const db = await getDB();
  return db.get("inventories", reminderId);
}

export async function adjustInventory(
  reminderId: string,
  delta: number,
): Promise<Inventory | undefined> {
  const db = await getDB();
  const existing = await db.get("inventories", reminderId);
  if (!existing) return undefined;
  const updated: Inventory = {
    ...existing,
    remaining: Math.max(0, existing.remaining + delta),
    updatedAt: Date.now(),
  };
  await db.put("inventories", updated);
  broadcast({ type: "inventory-changed", reminderId });
  return updated;
}

export async function refillInventory(
  reminderId: string,
  newRemaining: number,
): Promise<Inventory | undefined> {
  const db = await getDB();
  const existing = await db.get("inventories", reminderId);
  if (!existing) return undefined;
  const now = Date.now();
  const updated: Inventory = {
    ...existing,
    remaining: newRemaining,
    lastRefillAt: now,
    updatedAt: now,
  };
  await db.put("inventories", updated);
  broadcast({ type: "inventory-changed", reminderId });
  return updated;
}

export async function listLowStock(): Promise<Inventory[]> {
  const db = await getDB();
  const all = await db.getAll("inventories");
  return all.filter((inv) => inv.remaining <= inv.refillThreshold);
}
