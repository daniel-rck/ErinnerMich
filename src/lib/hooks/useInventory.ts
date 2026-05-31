import { useCallback, useEffect, useState } from "react";
import { subscribe } from "../db/broadcast";
import { getInventory, listLowStock } from "../db/inventories";
import type { Inventory } from "../types";

export function useInventory(reminderId: string | null): {
  inventory: Inventory | null;
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!reminderId) {
      setInventory(null);
      setLoading(false);
      return;
    }
    const result = await getInventory(reminderId);
    setInventory(result ?? null);
    setLoading(false);
  }, [reminderId]);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribe((message) => {
      if (
        (message.type === "inventory-changed" && message.reminderId === reminderId) ||
        message.type === "db-cleared"
      ) {
        void reload();
      }
    });
    return unsubscribe;
  }, [reload, reminderId]);

  return { inventory, loading, reload };
}

export function useLowStock(): { items: Inventory[]; loading: boolean } {
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await listLowStock();
      if (!cancelled) {
        setItems(result);
        setLoading(false);
      }
    }

    void load();
    const unsubscribe = subscribe((message) => {
      if (message.type === "inventory-changed" || message.type === "db-cleared") {
        void load();
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { items, loading };
}
