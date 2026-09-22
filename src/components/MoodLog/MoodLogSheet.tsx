import { useState } from "react";
import { addMoodEntry } from "../../lib/db/moodEntries";
import type { MoodValue } from "../../lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { vibrate } from "../ui/Haptic";
import { useToast } from "../ui/Toast";

const MOOD_OPTIONS: {
  value: MoodValue;
  emoji: string;
  label: string;
  /** Caption under the emoji — distinct per value (the first word of `label` repeats). */
  short: string;
}[] = [
  { value: 1, emoji: "😞", label: "Sehr schlecht", short: "Mies" },
  { value: 2, emoji: "😕", label: "Eher schlecht", short: "Naja" },
  { value: 3, emoji: "😐", label: "Neutral", short: "Okay" },
  { value: 4, emoji: "🙂", label: "Eher gut", short: "Gut" },
  { value: 5, emoji: "😄", label: "Sehr gut", short: "Super" },
];

const SUGGESTED_TAGS = ["Schlaf", "Sport", "Arbeit", "Familie", "Stress", "Sonne", "Krank"];

interface MoodLogSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MoodLogSheet({ open, onClose }: MoodLogSheetProps) {
  const toast = useToast();
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setMood(null);
    setTags([]);
    setNote("");
    setSubmitting(false);
  }

  async function save() {
    if (mood === null || submitting) return;
    setSubmitting(true);
    const loggedAt = Date.now();
    try {
      await addMoodEntry({
        loggedAt,
        mood,
        tags: tags.length > 0 ? tags : undefined,
        note: note.trim() || undefined,
      });
      vibrate("success");
      toast.show({ variant: "success", message: "Stimmung gespeichert" });
      reset();
      onClose();
    } catch (err) {
      toast.show({
        variant: "error",
        message: err instanceof Error ? err.message : "Speichern fehlgeschlagen",
      });
      setSubmitting(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Wie geht es dir gerade?"
    >
      <div className="flex flex-col gap-5 pb-6">
        <div className="flex justify-between gap-1">
          {MOOD_OPTIONS.map((opt) => {
            const active = mood === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                // Selecting only — saving right on the first tap made tags and
                // the note below unreachable.
                onClick={() => setMood(opt.value)}
                aria-label={opt.label}
                aria-pressed={active}
                className={
                  "flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 text-3xl transition " +
                  (active
                    ? "border-accent-500 bg-accent-softer"
                    : "border-border hover:border-accent-300")
                }
              >
                <span aria-hidden>{opt.emoji}</span>
                <span className="text-[11px] text-fg-muted">{opt.short}</span>
              </button>
            );
          })}
        </div>

        {mood !== null && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                Tags (optional)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-pressed={active}
                      className={
                        "rounded-full border px-3 py-1 text-sm " +
                        (active
                          ? "border-accent-500 bg-accent-soft text-fg"
                          : "border-border hover:border-accent-300")
                      }
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                Notiz (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                placeholder="Was beschäftigt dich gerade?"
              />
            </label>

            <button
              type="button"
              onClick={() => void save()}
              disabled={submitting}
              className="rounded-md bg-accent-600 px-4 py-2.5 text-sm font-medium text-fg-on-accent hover:bg-accent-700 disabled:opacity-50"
            >
              Stimmung speichern
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
