import { useCallback, useState } from "react";
import { addMoodEntry } from "../../lib/db/moodEntries";
import type { MoodValue } from "../../lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { vibrate } from "../ui/Haptic";
import { useToast } from "../ui/Toast";

const MOOD_OPTIONS: {
  value: MoodValue;
  emoji: string;
  label: string;
}[] = [
  { value: 1, emoji: "😞", label: "Sehr schlecht" },
  { value: 2, emoji: "😕", label: "Eher schlecht" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Eher gut" },
  { value: 5, emoji: "😄", label: "Sehr gut" },
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

  const quickSave = useCallback(
    async (value: MoodValue) => {
      if (submitting) return;
      setSubmitting(true);
      const loggedAt = Date.now();
      try {
        await addMoodEntry({
          loggedAt,
          mood: value,
        });
        vibrate("success");
        toast.show({ variant: "success", message: "Mood gespeichert" });
        reset();
        onClose();
      } catch (err) {
        toast.show({
          variant: "error",
          message: err instanceof Error ? err.message : "Speichern fehlgeschlagen",
        });
        setSubmitting(false);
      }
    },
    [submitting, toast, onClose],
  );

  async function detailedSave() {
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
      toast.show({ variant: "success", message: "Mood gespeichert" });
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
                onClick={() => (mood === null ? void quickSave(opt.value) : setMood(opt.value))}
                aria-label={opt.label}
                aria-pressed={active}
                className={
                  "flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 text-3xl transition " +
                  (active
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600")
                }
              >
                <span aria-hidden>{opt.emoji}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {opt.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {mood !== null && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
                          ? "border-brand-500 bg-brand-100 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100"
                          : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600")
                      }
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Notiz (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Was beschäftigt dich gerade?"
              />
            </label>

            <button
              type="button"
              onClick={() => void detailedSave()}
              disabled={submitting}
              className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Speichern
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
