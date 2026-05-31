import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const BASE = [
  "w-full",
  "bg-[color:var(--color-surface)]",
  "text-[length:0.9375rem] text-[color:var(--color-fg)]",
  "placeholder:text-[color:var(--color-fg-subtle)]",
  "border border-[color:var(--color-border)]",
  "rounded-[0.875rem]",
  "px-[0.75rem] py-[0.5rem]",
  "transition-[border-color,box-shadow] duration-[140ms] ease-[cubic-bezier(0.2,0,0,1)]",
  "focus:border-[color:var(--color-accent-500)]",
  "aria-[invalid=true]:border-[color:var(--color-danger)]",
  "disabled:opacity-60 disabled:cursor-not-allowed",
].join(" ");

const HEIGHT = "min-h-[48px]";

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
      className={[BASE, "py-[0.75rem] resize-y", className].join(" ")}
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
