import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { addToolEntry } from "../../lib/db/toolEntries";
import { useToolEntries } from "../../lib/hooks/useToolEntries";
import { useToast } from "../ui/Toast";
import { useDeleteEntryWithUndo } from "./useDeleteEntryWithUndo";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function WorryBox() {
  const [text, setText] = useState("");
  const [autoDelete, setAutoDelete] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { entries } = useToolEntries({ toolKey: "worry" });
  const removeEntry = useDeleteEntryWithUndo("Sorge gelöscht");

  async function submit() {
    const value = text.trim();
    if (!value) return;
    setSubmitting(true);
    const now = Date.now();
    try {
      await addToolEntry({
        toolKey: "worry",
        loggedAt: now,
        text: value,
        expiresAt: autoDelete ? now + THIRTY_DAYS_MS : undefined,
      });
      setText("");
      toast.show({
        variant: "success",
        message: "In der Box. Du darfst jetzt loslassen.",
      });
    } catch {
      toast.show({
        variant: "error",
        message: "Konnte Sorge nicht speichern.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-fg-muted">
        Schreib auf, was dich beschäftigt. Die Sorge ist hier abgelegt — du darfst sie loslassen.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Was beschäftigt dich gerade?"
          aria-label="Deine Sorge"
          className="resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={autoDelete}
            onChange={(e) => setAutoDelete(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Nach 30 Tagen automatisch löschen
        </label>
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-fg-on-accent hover:bg-accent-700 disabled:opacity-50"
        >
          In die Box ablegen
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase text-fg-muted">
          Abgelegte Sorgen ({entries.length})
        </h2>
        <ul className="flex flex-col gap-2">
          <AnimatePresence>
            {entries.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, scale: 0.92, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-3"
              >
                <span className="text-lg" aria-hidden>
                  📦
                </span>
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{e.text}</p>
                  <p className="mt-1 text-xs text-fg-muted">
                    {new Date(e.loggedAt).toLocaleDateString("de-DE")}
                    {e.expiresAt
                      ? ` · wird am ${new Date(e.expiresAt).toLocaleDateString("de-DE")} gelöscht`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeEntry(e)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-sunken hover:text-danger-fg no-min-tap"
                  aria-label="Sorge löschen"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
          {entries.length === 0 && (
            <li className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-fg-muted">
              Box ist leer.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
