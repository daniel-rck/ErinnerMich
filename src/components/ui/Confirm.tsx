import { type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from "./confirmContext";
import { Modal } from "./Modal";

interface PendingState {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);
  const pendingRef = useRef<PendingState | null>(null);

  const confirm: ConfirmFn = useCallback((options) => {
    return new Promise<boolean>((resolve) => {
      // If a previous dialog is still open, resolve it as `false` so the
      // earlier caller's promise never leaks.
      const previous = pendingRef.current;
      if (previous) previous.resolve(false);
      const next: PendingState = { options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button when the dialog opens. An effect rather than
  // autoFocus: the attribute grabs focus on mount regardless of context.
  useEffect(() => {
    if (pending !== null) confirmRef.current?.focus();
  }, [pending]);

  function resolveAndClose(answer: boolean) {
    pendingRef.current?.resolve(answer);
    pendingRef.current = null;
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={pending !== null}
        onClose={() => resolveAndClose(false)}
        title={pending?.options.title ?? "Bestätigen"}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => resolveAndClose(false)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-sunken"
            >
              {pending?.options.cancelLabel ?? "Abbrechen"}
            </button>
            <button
              type="button"
              onClick={() => resolveAndClose(true)}
              ref={confirmRef}
              className={
                "rounded-md px-4 py-2 text-sm font-medium text-fg-on-accent " +
                (pending?.options.destructive
                  ? "bg-danger hover:opacity-90"
                  : "bg-accent-600 hover:bg-accent-700")
              }
            >
              {pending?.options.confirmLabel ?? "Bestätigen"}
            </button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{pending?.options.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm muss innerhalb von <ConfirmProvider> stehen");
  return ctx;
}
