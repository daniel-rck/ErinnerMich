import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { dayKey } from "../lib/db/index";
import { affirmationForDay } from "../lib/tools/affirmations";

export function TodayAffirmation() {
  const [today] = useState(() => affirmationForDay(dayKey(Date.now())));
  return (
    <Link
      to="/tools/affirmation"
      className={[
        "group relative flex items-center gap-3 overflow-hidden",
        "rounded-[1.25rem] p-[1rem]",
        "bg-gradient-to-br from-[color:var(--color-accent-soft)] via-[color:var(--color-surface)] to-[color:var(--color-accent-soft)]",
        "border border-[color:var(--color-border)]",
        "shadow-[0_1px_2px_oklch(20%_0.01_285/0.06),0_1px_1px_oklch(20%_0.01_285/0.04)]",
        "transition-shadow duration-[240ms]",
        "hover:shadow-[0_4px_12px_oklch(20%_0.01_285/0.08),0_2px_4px_oklch(20%_0.01_285/0.04)]",
      ].join(" ")}
    >
      <div
        aria-hidden
        className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[color:var(--color-accent-500)] to-[color:var(--color-accent-500)] opacity-20 blur-2xl"
      />
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface)] shadow-[0_1px_2px_oklch(20%_0.01_285/0.06),0_1px_1px_oklch(20%_0.01_285/0.04)]">
        <Sparkles size={18} className="text-[color:var(--color-accent-600)]" aria-hidden />
      </div>
      <p className="relative text-[length:0.9375rem] font-medium leading-snug text-[color:var(--color-fg)]">
        „{today.text}“
      </p>
    </Link>
  );
}
