export interface Shortcut {
  /** Single key like "n" or chord like "g t". Lowercase, space-separated. */
  combo: string;
  description: string;
  action: () => void;
}

export interface ShortcutMatcherState {
  /** Currently buffered prefix (e.g. "g" while waiting for the second key). */
  buffer: string[];
  /** Timestamp the buffer was last updated; expires after CHORD_TIMEOUT_MS. */
  lastInputAt: number;
}

const CHORD_TIMEOUT_MS = 1500;

export function emptyShortcutState(): ShortcutMatcherState {
  return { buffer: [], lastInputAt: 0 };
}

/**
 * Pure matcher: given the previous state and an incoming key, returns the
 * next state plus the matched shortcut (if any).
 */
export function matchShortcut(
  state: ShortcutMatcherState,
  key: string,
  shortcuts: readonly Shortcut[],
  now: number = Date.now(),
): { next: ShortcutMatcherState; matched: Shortcut | null } {
  const lower = key.toLowerCase();
  const buffer = now - state.lastInputAt > CHORD_TIMEOUT_MS ? [] : state.buffer.slice();
  buffer.push(lower);
  const combo = buffer.join(" ");

  const direct = shortcuts.find((s) => s.combo === combo);
  if (direct) {
    return { next: emptyShortcutState(), matched: direct };
  }

  const partial = shortcuts.some((s) => s.combo.startsWith(combo + " "));
  if (partial) {
    return { next: { buffer, lastInputAt: now }, matched: null };
  }

  return { next: emptyShortcutState(), matched: null };
}

export function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const ce = target.getAttribute("contenteditable");
  if (ce === "" || ce === "true" || ce === "plaintext-only") return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}
