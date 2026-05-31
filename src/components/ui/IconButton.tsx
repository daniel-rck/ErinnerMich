import type { LucideIcon } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { type HapticPattern, vibrate } from "./Haptic";

export type IconButtonShape = "circle" | "square";
export type IconButtonTone = "neutral" | "brand" | "danger" | "glass";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  "aria-label": string;
  shape?: IconButtonShape;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  haptic?: HapticPattern | false;
}

const SIZE_PX: Record<IconButtonSize, number> = { sm: 36, md: 44, lg: 52 };
const ICON_PX: Record<IconButtonSize, number> = { sm: 16, md: 20, lg: 22 };

const TONE: Record<IconButtonTone, string> = {
  neutral: [
    "bg-[color:var(--color-surface-sunken)] text-[color:var(--color-text-primary)]",
    "hover:bg-[color:var(--color-border-subtle)]",
    "active:bg-[color:var(--color-border-strong)]",
  ].join(" "),
  brand: [
    "bg-[color:var(--color-brand-600)] text-[color:var(--color-text-on-brand)]",
    "shadow-[var(--elev-brand)]",
    "hover:bg-[color:var(--color-brand-700)] active:bg-[color:var(--color-brand-800)]",
  ].join(" "),
  danger: [
    "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
    "hover:brightness-95 active:brightness-90",
  ].join(" "),
  glass: [
    "surface-glass-strong text-[color:var(--color-text-primary)]",
    "hover:bg-[color:var(--color-surface-elevated)]",
  ].join(" "),
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon: Icon,
    shape = "circle",
    tone = "neutral",
    size = "md",
    haptic = "tick",
    className = "",
    onClick,
    type = "button",
    ...rest
  },
  ref,
) {
  const px = SIZE_PX[size];
  return (
    <button
      ref={ref}
      type={type}
      onClick={(e) => {
        if (haptic) vibrate(haptic);
        onClick?.(e);
      }}
      className={[
        "inline-flex items-center justify-center select-none",
        shape === "circle" ? "rounded-full" : "rounded-[var(--radius-md)]",
        "transition-[background-color,box-shadow,transform,filter] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        TONE[tone],
        className,
      ].join(" ")}
      style={{ width: px, height: px }}
      {...rest}
    >
      <Icon size={ICON_PX[size]} strokeWidth={2} aria-hidden />
    </button>
  );
});
