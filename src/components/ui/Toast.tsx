import {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ulid } from 'ulid'
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react'
import {
  ToastContext,
  type Toast,
  type ToastInput,
  type ToastVariant,
} from './toastContext'

const DEFAULT_DURATION = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (input: ToastInput): string => {
      const id = ulid()
      const toast: Toast = {
        id,
        variant: input.variant ?? 'info',
        message: input.message,
        action: input.action,
        durationMs: input.durationMs ?? DEFAULT_DURATION,
      }
      setToasts((prev) => [...prev, toast])
      const timer = setTimeout(() => dismiss(id), toast.durationMs)
      timers.current.set(id, timer)
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, show, dismiss }), [toasts, show, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: Toast[]
  dismiss: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:bottom-4 sm:items-end sm:pr-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg dark:bg-zinc-900"
            data-variant={toast.variant}
            style={borderForVariant(toast.variant)}
          >
            <ToastIcon variant={toast.variant} />
            <span className="flex-1 leading-snug">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.onClick()
                  dismiss(toast.id)
                }}
                className="-my-1 rounded-md px-2 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Schließen"
              className="-my-1 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function borderForVariant(variant: ToastVariant): React.CSSProperties {
  switch (variant) {
    case 'success':
      return { borderColor: 'rgb(16 185 129 / 0.4)' }
    case 'error':
      return { borderColor: 'rgb(244 63 94 / 0.4)' }
    default:
      return { borderColor: 'rgb(212 212 216 / 0.6)' }
  }
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success')
    return <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
  if (variant === 'error')
    return <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
  return <Info size={18} className="mt-0.5 shrink-0 text-brand-600" />
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast muss innerhalb von <ToastProvider> stehen')
  return ctx
}
