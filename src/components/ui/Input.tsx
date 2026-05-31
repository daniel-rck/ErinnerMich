import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const BASE = [
  "w-full",
  "bg-[color:var(--color-surface-elevated)]",
  "text-[length:var(--text-body)] text-[color:var(--color-text-primary)]",
  "placeholder:text-[color:var(--color-text-tertiary)]",
  "border border-[color:var(--color-border-strong)]",
  "rounded-[var(--radius-md)]",
  "px-[var(--space-sm)] py-[var(--space-xs)]",
  "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
  "focus:border-[color:var(--color-brand-500)]",
  "aria-[invalid=true]:border-[color:var(--color-danger)]",
  "disabled:opacity-60 disabled:cursor-not-allowed",
].join(" ");

const HEIGHT = "min-h-[var(--tap-target)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", type = "text", ...rest }, ref) {
    return (
      <input ref={ref} type={type} className={[BASE, HEIGHT, className].join(" ")} {...rest} />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", rows = 3, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={[BASE, "py-[var(--space-sm)] resize-y", className].join(" ")}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={[BASE, HEIGHT, "pr-8 appearance-none", className].join(" ")}
        {...rest}
      >
        {children}
      </select>
    );
  },
);
