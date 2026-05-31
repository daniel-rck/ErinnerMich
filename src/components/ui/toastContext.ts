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
