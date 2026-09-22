import { type RefObject, useEffect, useRef } from "react";

// Open overlays, innermost last. Only the topmost one handles Escape/Tab, so a
// Confirm over a Sheet closes alone instead of taking the sheet with it.
type Entry = { id: symbol; container: HTMLElement | null };
const stack: Entry[] = [];

/**
 * Pushes an overlay, keeping DOM-nested overlays below their children: when a
 * parent and child mount in the same commit, the child's effect runs first,
 * so a plain push would put the parent on top.
 */
function push(entry: Entry): void {
  const below = stack.findIndex((e) => entry.container?.contains(e.container) ?? false);
  if (below === -1) stack.push(entry);
  else stack.splice(below, 0, entry);
}

// Ref-counted scroll lock: closing an inner overlay must not unlock the page
// while an outer one is still open, and the pre-lock value is restored.
let lockCount = 0;
let savedOverflow = "";

function lockScroll(): void {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = savedOverflow;
}

/** True while any modal overlay is open — global shortcuts stay quiet then. */
export function isOverlayOpen(): boolean {
  return stack.length > 0;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusables(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.closest("[aria-hidden='true']"),
  );
}

/**
 * Modal behaviour for dialogs and sheets: moves focus into `containerRef` on
 * open, keeps Tab inside it, closes on Escape (topmost overlay only), locks
 * page scroll, and gives focus back to where it was on close.
 *
 * `onClose` is read through a ref: callers pass inline closures, and having it
 * in the effect deps re-ran the effect on every parent render — which bounced
 * focus out of the dialog and back.
 */
export function useOverlay(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
): void {
  const onCloseRef = useRef(onClose);
  // oxlint-disable-next-line react/refs -- latest-ref: the listener must call the newest `onClose`
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const id = Symbol("overlay");
    push({ id, container: containerRef.current });
    lockScroll();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // A parent mounting together with an open child must not pull focus back.
    if (stack.at(-1)?.id === id) containerRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (stack.at(-1)?.id !== id) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const items = focusables(container);
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) {
        event.preventDefault();
        container.focus();
        return;
      }
      const active = document.activeElement;
      const inside = active instanceof Node && container.contains(active);
      if (event.shiftKey && (active === first || active === container || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const index = stack.findIndex((e) => e.id === id);
      if (index !== -1) stack.splice(index, 1);
      unlockScroll();
      previouslyFocused?.focus?.();
    };
  }, [open, containerRef]);
}
