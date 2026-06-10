import { forwardRef, type InputHTMLAttributes } from "react";

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
