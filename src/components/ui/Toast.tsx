import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ulid } from "ulid";
import { type Toast, ToastContext, type ToastInput, type ToastVariant } from "./toastContext";

const DEFAULT_DURATION = 5000;
// A toast with an action (undo) stays longer: keyboard and screen-reader users
// need time to reach the button (WCAG 2.2.1).
const ACTION_MIN_DURATION = 8000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Mirror for callbacks and the unmount cleanup, which must see the latest list.
  const toastsRef = useRef<Toast[]>([]);
  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const remove = useCallback((id: string, expired: boolean) => {
    const toast = toastsRef.current.find((t) => t.id === id);
    if (!toast) return;
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (expired) toast.onExpire?.();
  }, []);

  const dismiss = useCallback((id: string) => remove(id, true), [remove]);

  const show = useCallback((input: ToastInput): string => {
    const id = ulid();
    const base = input.durationMs ?? DEFAULT_DURATION;
    const toast: Toast = {
      ...input,
      id,
      variant: input.variant ?? "info",
      durationMs: input.action ? Math.max(base, ACTION_MIN_DURATION) : base,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  // Toasts still pending when the provider unmounts count as expired, so a
  // pending delete still commits.
  useEffect(
    () => () => {
      for (const t of toastsRef.current) t.onExpire?.();
    },
    [],
  );

  const value = useMemo(() => ({ toasts, show, dismiss }), [toasts, show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onExpire={dismiss} onAction={(id) => remove(id, false)} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onExpire,
  onAction,
}: {
  toasts: Toast[];
  onExpire: (id: string) => void;
  onAction: (id: string) => void;
}) {
  // One polite live region. Items carry no role of their own: nested live
  // regions got announced twice, and an alert inside a polite region can be
  // downgraded anyway.
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:items-end sm:pr-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onExpire={onExpire} onAction={onAction} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onExpire,
  onAction,
}: {
  toast: Toast;
  onExpire: (id: string) => void;
  onAction: (id: string) => void;
}) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.durationMs);

  // Pauses while hovered or focused, so an undo can't vanish under the cursor.
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = setTimeout(() => onExpire(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, toast.id, onExpire]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm shadow-lg ${BORDER[toast.variant]}`}
      data-variant={toast.variant}
    >
      <ToastIcon variant={toast.variant} />
      <span className="flex-1 leading-snug">
        {toast.variant === "error" && <span className="sr-only">Fehler: </span>}
        {toast.message}
      </span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onAction(toast.id);
          }}
          className="-my-1 rounded-md px-2 py-1 text-sm font-medium text-accent-700 hover:bg-accent-softer dark:text-accent-300"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onExpire(toast.id)}
        aria-label="Schließen"
        className="-my-1 rounded-md p-1 text-fg-muted hover:bg-surface-sunken hover:text-fg"
      >
        <X size={16} aria-hidden />
      </button>
    </motion.div>
  );
}

const BORDER: Record<ToastVariant, string> = {
  success: "border-[color:color-mix(in_oklab,var(--color-success)_45%,transparent)]",
  error: "border-[color:color-mix(in_oklab,var(--color-danger)_45%,transparent)]",
  info: "border-border",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success")
    return <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-fg" aria-hidden />;
  if (variant === "error")
    return <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-fg" aria-hidden />;
  return <Info size={18} className="mt-0.5 shrink-0 text-accent-600" aria-hidden />;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast muss innerhalb von <ToastProvider> stehen");
  return ctx;
}
