import { useEffect, useMemo, useRef, useState } from "react";
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
import { Modal } from "./ui/Modal";
import { isOverlayOpen } from "./ui/useOverlay";

export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const moodLog = useMoodLog();
  const { wellnessToolsEnabled } = useSettings();
  const [helpOpen, setHelpOpen] = useState(false);
  const stateRef = useRef<ShortcutMatcherState>(emptyShortcutState());

  // One list drives both the key handler and the help dialog.
  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        combo: "n",
        description: "Neue Erinnerung",
        action: () => navigate("/new?kind=reminder"),
      },
      { combo: "h", description: "Neues Habit", action: () => navigate("/new?kind=habit") },
      ...(wellnessToolsEnabled
        ? [
            { combo: "m", description: "Stimmung eintragen", action: () => moodLog.open() },
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
      { combo: "?", description: "Diese Hilfe", action: () => setHelpOpen(true) },
    ],
    [navigate, moodLog, wellnessToolsEnabled],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextInputTarget(event.target)) return;
      // With a dialog open, "n" or "g s" must not navigate behind it.
      if (isOverlayOpen()) {
        stateRef.current = emptyShortcutState();
        return;
      }
      if (event.key === "Escape") {
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
  }, [shortcuts]);

  return (
    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Tastenkürzel" size="sm">
      <ul className="flex flex-col gap-1 text-sm">
        {[...shortcuts, { combo: "Esc", description: "Schließen" }].map(
          ({ combo, description }) => (
            <li key={combo} className="flex items-center justify-between gap-3">
              <span className="text-fg-muted">{description}</span>
              <kbd className="rounded border border-border bg-surface-sunken px-2 py-0.5 font-mono text-xs text-fg-muted">
                {combo}
              </kbd>
            </li>
          ),
        )}
      </ul>
    </Modal>
  );
}
