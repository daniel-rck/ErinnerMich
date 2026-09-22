import { getInventory, listLowStock } from "../db/inventories";
import type { Inventory } from "../types";
import { useDbQuery } from "./useDbQuery";

export function useInventory(reminderId: string | null): {
  inventory: Inventory | null;
  loading: boolean;
  reload: () => Promise<void>;
} {
  const { data, loading, reload } = useDbQuery<Inventory | null>(
    async () => (reminderId ? ((await getInventory(reminderId)) ?? null) : null),
    null,
    (message) =>
      (message.type === "inventory-changed" && message.reminderId === reminderId) ||
      (message.type === "reminder-deleted" && message.id === reminderId),
    [reminderId],
  );
  return { inventory: data, loading, reload };
}

export function useLowStock(): { items: Inventory[]; loading: boolean } {
  const { data, loading } = useDbQuery<Inventory[]>(
    listLowStock,
    [],
    // `deleteReminder` drops the inventory too but only announces the reminder.
    (message) => message.type === "inventory-changed" || message.type === "reminder-deleted",
    [],
  );
  return { items: data, loading };
}
