import { createContext } from "react";

export type ToastVariant = "info" | "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  variant?: ToastVariant;
  message: string;
  action?: ToastAction;
  durationMs?: number;
  /**
   * Runs once when the toast goes away without its action being used (timeout
   * or close button). Lets "delete with undo" commit exactly when undo stops
   * being possible — a separate timer drifted once the toast could pause.
   */
  onExpire?: () => void;
}

export interface Toast extends ToastInput {
  id: string;
  variant: ToastVariant;
  durationMs: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  show: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
