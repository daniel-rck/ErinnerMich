import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../lib/hooks/useSettings";
import {
  emptyShortcutState,
  isTextInputTarget,
  matchShortcut,
  type Shortcut,
  type ShortcutMatcherState,
} from "../lib/keyboard/shortcuts";
import { useMoodLog } from "./MoodLog/MoodLogProvider";

export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const moodLog = useMoodLog();
  const { wellnessToolsEnabled } = useSettings();
  const [helpOpen, setHelpOpen] = useState(false);
  const stateRef = useRef<ShortcutMatcherState>(emptyShortcutState());

  useEffect(() => {
    const shortcuts: Shortcut[] = [
      { combo: "n", description: "Neuer Reminder", action: () => navigate("/new?kind=reminder") },
      { combo: "h", description: "Neue Habit", action: () => navigate("/new?kind=habit") },
      ...(wellnessToolsEnabled
        ? [
            { combo: "m", description: "Mood loggen", action: () => moodLog.open() },
            { combo: "g m", description: "Stimmung", action: () => navigate("/mood") },
          ]
        : []),
      { combo: "g t", description: "Heute", action: () => navigate("/") },
      { combo: "g r", description: "Routinen", action: () => navigate("/library") },
      { combo: "g u", description: "Du", action: () => navigate("/you") },
      { combo: "g h", description: "Habits", action: () => navigate("/habits") },
      { combo: "g a", description: "Alle", action: () => navigate("/all") },
      { combo: "g s", description: "Statistik", action: () => navigate("/stats") },
      { combo: "g e", description: "Einstellungen", action: () => navigate("/settings") },
      { combo: "?", description: "Hilfe", action: () => setHelpOpen(true) },
    ];

    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextInputTarget(event.target)) return;
      if (event.key === "Escape") {
        setHelpOpen(false);
        stateRef.current = emptyShortcutState();
        return;
      }
      // ignore IME composing + multi-char keys
      if (event.key.length !== 1 && event.key !== "?") return;
      const { next, matched } = matchShortcut(stateRef.current, event.key, shortcuts);
      stateRef.current = next;
      if (matched) {
        event.preventDefault();
        matched.action();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, moodLog, wellnessToolsEnabled]);

  if (!helpOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-help-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) setHelpOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setHelpOpen(false);
      }}
    >
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h2 id="kbd-help-title" className="mb-3 text-lg font-semibold">
          Tastenkürzel
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          {(
            [
              ["n", "Neuer Reminder"],
              ["h", "Neue Habit"],
              ...(wellnessToolsEnabled
                ? ([
                    ["m", "Mood loggen"],
                    ["g m", "Stimmung"],
                  ] as [string, string][])
                : []),
              ["g t", "Heute"],
              ["g r", "Routinen"],
              ["g u", "Du"],
              ["g h", "Habits"],
              ["g a", "Alle"],
              ["g s", "Statistik"],
              ["g e", "Einstellungen"],
              ["?", "Diese Hilfe"],
              ["Esc", "Schließen"],
            ] as [string, string][]
          ).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
              <kbd className="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 font-mono text-xs text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {key}
              </kbd>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setHelpOpen(false)}
          className="mt-4 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
