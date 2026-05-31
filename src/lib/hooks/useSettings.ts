import { useEffect, useState } from "react";
import { subscribe } from "../db/broadcast";
import { readSettings, type Settings } from "../db/settings";

export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(() => readSettings());

  useEffect(() => {
    const update = () => setSettings(readSettings());

    const unsub = subscribe((msg) => {
      if (msg.type === "settings-changed" || msg.type === "db-cleared") update();
    });

    const handler = () => update();
    window.addEventListener("erinnermich:settings-changed", handler);
    window.addEventListener("storage", update);

    return () => {
      unsub();
      window.removeEventListener("erinnermich:settings-changed", handler);
      window.removeEventListener("storage", update);
    };
  }, []);

  return settings;
}
