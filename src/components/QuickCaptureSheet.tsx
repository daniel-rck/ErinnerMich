import { Bell, BookOpen, Flame, Send, Smile, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReminder } from "../lib/db/reminders";
import { useSettings } from "../lib/hooks/useSettings";
import { quickParse } from "../lib/schedule/quickParse";
import { useMoodLog } from "./MoodLog/MoodLogProvider";
import { Button } from "./ui/Button";
import { vibrate } from "./ui/Haptic";
import { Sheet } from "./ui/Sheet";
import { useToast } from "./ui/Toast";

interface QuickCaptureSheetProps {
  open: boolean;
  onClose: () => void;
}

export function QuickCaptureSheet({ open, onClose }: QuickCaptureSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the field when the sheet opens. An effect rather than autoFocus: the
  // attribute grabs focus on mount regardless of context, which is disorienting
  // with a screen reader.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const navigate = useNavigate();
  const toast = useToast();
  const moodLog = useMoodLog();
  const { wellnessToolsEnabled } = useSettings();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  function goto(target: string) {
    onClose();
    navigate(target);
  }

  async function submitQuickCapture() {
    const trimmed = input.trim();
    if (trimmed.length === 0 || busy) return;
    setBusy(true);
    try {
      const parsed = quickParse(trimmed);
      if (!parsed) {
        onClose();
        navigate(`/new?kind=reminder&title=${encodeURIComponent(trimmed)}`);
        toast.show({ message: "Konnte Zeit nicht erkennen — bitte ergänze die Details." });
        setInput("");
        return;
      }
      const created = await createReminder({
        kind: "reminder",
        title: parsed.title,
        icon: "⏰",
        category: "other",
        color: "brand",
        schedule: parsed.schedule,
        streakSensitive: false,
        active: true,
      });
      vibrate("success");
      onClose();
      toast.show({
        variant: "success",
        message: `„${parsed.title}“ angelegt`,
        action: { label: "Bearbeiten", onClick: () => navigate(`/edit/${created.id}`) },
      });
      setInput("");
    } catch (err) {
      toast.show({
        variant: "error",
        message: err instanceof Error ? err.message : "Anlegen fehlgeschlagen",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Was möchtest du anlegen?">
      <div className="flex flex-col gap-[1rem] pb-[1rem]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitQuickCapture();
          }}
          className={[
            "flex items-center gap-2 pl-[1rem] pr-1 py-1",
            "rounded-full bg-[color:var(--color-surface-sunken)]",
            "border border-[color:var(--color-border)]",
            "focus-within:border-[color:var(--color-accent-500)]",
          ].join(" ")}
        >
          <Sparkles
            size={16}
            aria-hidden
            className="shrink-0 text-[color:var(--color-fg-subtle)]"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="z.B. „Mama Sonntag 18 Uhr“"
            aria-label="Schnell-Eintrag"
            className="min-w-0 flex-1 bg-transparent text-[length:0.9375rem] focus:outline-none placeholder:text-[color:var(--color-fg-subtle)]"
            disabled={busy}
            ref={inputRef}
          />
          <button
            type="submit"
            disabled={busy || input.trim().length === 0}
            aria-label="Anlegen"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-accent-600)] text-[color:white] disabled:opacity-40 transition-colors hover:bg-[color:var(--color-accent-700)] no-min-tap"
          >
            <Send size={16} />
          </button>
        </form>

        <div className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
          Oder
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="lg"
            leadingIcon={Bell}
            onClick={() => goto("/new?kind=reminder")}
            fullWidth
            className="justify-start"
          >
            Erinnerung
          </Button>
          <Button
            variant="secondary"
            size="lg"
            leadingIcon={Flame}
            onClick={() => goto("/new?kind=habit")}
            fullWidth
            className="justify-start"
          >
            Habit
          </Button>
          {wellnessToolsEnabled && (
            <Button
              variant="secondary"
              size="lg"
              leadingIcon={Smile}
              onClick={() => {
                onClose();
                moodLog.open();
              }}
              fullWidth
              className="justify-start"
            >
              Stimmung
            </Button>
          )}
          <Button
            variant="secondary"
            size="lg"
            leadingIcon={BookOpen}
            onClick={() => goto("/new?kind=reminder")}
            fullWidth
            className="justify-start"
          >
            Vorlage
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
