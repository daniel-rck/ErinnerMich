import { AnimatePresence, motion } from "framer-motion";
import { Heart, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { at } from "../../lib/at.ts";
import { dayKey } from "../../lib/db/index";
import { addToolEntry } from "../../lib/db/toolEntries";
import {
  AFFIRMATIONS,
  type Affirmation as AffirmationDef,
  affirmationForDay,
} from "../../lib/tools/affirmations";
import { useToast } from "../ui/Toast";

export function Affirmation() {
  const [today] = useState(() => affirmationForDay(dayKey(Date.now())));
  const [shown, setShown] = useState<AffirmationDef>(today);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  function shuffle() {
    let next = shown;
    while (next.id === shown.id) {
      next = at(AFFIRMATIONS, Math.floor(Math.random() * AFFIRMATIONS.length));
    }
    setShown(next);
    setSaved(false);
  }

  async function save() {
    await addToolEntry({
      toolKey: "affirmation",
      loggedAt: Date.now(),
      affirmationId: shown.id,
      text: shown.text,
    });
    setSaved(true);
    toast.show({ variant: "success", message: "Mit dir genommen." });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Dein Satz für heute</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={shown.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 p-8 text-center shadow-sm dark:from-violet-950/40 dark:to-pink-950/40"
        >
          <p className="text-xl font-semibold leading-relaxed text-violet-950 dark:text-violet-50 sm:text-2xl">
            „{shown.text}“
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saved}
          className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <Heart size={16} /> {saved ? "Gespeichert" : "Mit mir nehmen"}
        </button>
        <button
          type="button"
          onClick={shuffle}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <RefreshCcw size={16} /> Andere
        </button>
      </div>

      {shown.id !== today.id && (
        <button
          type="button"
          onClick={() => {
            setShown(today);
            setSaved(false);
          }}
          className="text-xs text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Zurück zur heutigen Affirmation
        </button>
      )}
    </div>
  );
}
