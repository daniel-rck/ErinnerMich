import { motion } from "framer-motion";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs } from "../components/ui/Tabs";
import { FADE_UP, STAGGER_CONTAINER } from "../lib/design/motion";
import { SettingsPage } from "./Settings";
import { StatsPage } from "./Stats";

type YouTab = "stats" | "settings";
const TAB_KEYS: YouTab[] = ["stats", "settings"];

export function YouPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") as YouTab | null;
  const active: YouTab = useMemo(
    () => (requested && TAB_KEYS.includes(requested) ? requested : "stats"),
    [requested],
  );

  function setActive(next: string) {
    const np = new URLSearchParams(params);
    if (next === "stats") np.delete("tab");
    else np.set("tab", next);
    setParams(np, { replace: true });
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={STAGGER_CONTAINER}
      className="flex flex-col gap-[var(--space-lg)]"
    >
      <motion.header variants={FADE_UP} className="flex flex-col gap-[var(--space-2xs)]">
        <p className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          Profil
        </p>
        <h1 className="text-[length:var(--text-display)] font-semibold leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
          Du
        </h1>
      </motion.header>

      <motion.div variants={FADE_UP}>
        <Tabs value={active} onChange={setActive}>
          <Tabs.List ariaLabel="Profil-Bereiche">
            <Tabs.Trigger value="stats">Statistik</Tabs.Trigger>
            <Tabs.Trigger value="settings">Einstellungen</Tabs.Trigger>
          </Tabs.List>
          <div className="mt-[var(--space-md)]">
            <Tabs.Panel value="stats">
              <StatsPage embedded />
            </Tabs.Panel>
            <Tabs.Panel value="settings">
              <SettingsPage embedded />
            </Tabs.Panel>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
