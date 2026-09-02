import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { addToolEntry, deleteToolEntry } from "../../lib/db/toolEntries";
import { useToolEntries } from "../../lib/hooks/useToolEntries";
import { useToast } from "../ui/Toast";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function GratitudeJar() {
  const [text, setText] = useState("");
  const toast = useToast();
  const { entries } = useToolEntries({ toolKey: "gratitude" });

  const [now] = useState(() => Date.now());
  const recent = useMemo(() => {
    const cutoff = now - SEVEN_DAYS_MS;
    return entries.filter((e) => e.loggedAt >= cutoff);
  }, [entries, now]);

  const fillRatio = Math.min(1, recent.length / 21);

  async function submit() {
    const value = text.trim();
    if (!value) return;
    await addToolEntry({
      toolKey: "gratitude",
      loggedAt: Date.now(),
      text: value,
    });
    setText("");
    toast.show({ variant: "success", message: "Eintrag im Glas." });
  }

  async function remove(id: string) {
    await deleteToolEntry(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <Jar fill={fillRatio} count={recent.length} />
        <p className="text-sm text-fg-muted">{recent.length} Einträge in den letzten 7 Tagen</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor="gratitude-input" className="text-sm font-medium">
          Wofür bist du heute dankbar?
        </label>
        <div className="flex gap-2">
          <input
            id="gratitude-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={240}
            placeholder="ein kleiner Moment …"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-fg-on-accent hover:bg-amber-700 disabled:opacity-50"
          >
            Hinzufügen
          </button>
        </div>
      </form>

      <ul className="flex flex-col gap-2">
        {entries.slice(0, 30).map((e) => (
          <motion.li
            key={e.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <span className="text-lg" aria-hidden>
              🫙
            </span>
            <div className="flex-1">
              <p className="text-sm">{e.text}</p>
              <p className="mt-1 text-xs text-fg-muted">
                {new Date(e.loggedAt).toLocaleString("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void remove(e.id)}
              className="rounded p-1 text-fg-subtle hover:bg-surface-sunken hover:text-danger"
              aria-label="Eintrag löschen"
            >
              <Trash2 size={14} />
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Jar({ fill, count }: { fill: number; count: number }) {
  return (
    <svg
      viewBox="0 0 120 160"
      className="h-44 w-32"
      role="img"
      aria-label={`Glas mit ${count} Einträgen`}
    >
      <rect x="40" y="10" width="40" height="14" rx="4" fill="#a16207" />
      <path
        d="M28 30 L92 30 L96 50 L96 142 Q96 152 86 152 L34 152 Q24 152 24 142 L24 50 Z"
        fill="rgba(255,255,255,0.7)"
        stroke="#a16207"
        strokeWidth="2"
      />
      <motion.rect
        x="26"
        width="68"
        rx="2"
        fill="#fbbf24"
        initial={false}
        animate={{
          y: 152 - fill * 100,
          height: fill * 100,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      />
      <text x="60" y="105" textAnchor="middle" className="fill-amber-950 text-2xl font-bold">
        {count}
      </text>
    </svg>
  );
}
