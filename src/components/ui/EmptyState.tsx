import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon?: LucideIcon | string;
  title: string;
  description?: ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  illustration?: "spark" | "calm" | "celebrate";
  className?: string;
}

function Illustration({ kind }: { kind: "spark" | "calm" | "celebrate" }) {
  if (kind === "spark") {
    return (
      <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden>
        <defs>
          <radialGradient id="ill-spark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-brand-400)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-brand-600)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="40" cy="40" r="38" fill="url(#ill-spark)" />
        <path
          d="M40 18 L44 36 L62 40 L44 44 L40 62 L36 44 L18 40 L36 36 Z"
          fill="var(--color-brand-500)"
          opacity="0.8"
        />
      </svg>
    );
  }
  if (kind === "calm") {
    return (
      <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden>
        <defs>
          <linearGradient id="ill-calm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-calm)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-accent-calm)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="32" fill="url(#ill-calm)" />
        <path
          d="M14 50 Q26 38 40 50 T66 50"
          fill="none"
          stroke="var(--color-accent-calm)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden>
      <defs>
        <linearGradient id="ill-celebrate" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-glow)" />
          <stop offset="100%" stopColor="var(--color-accent-mood)" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="22" fill="url(#ill-celebrate)" opacity="0.85" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="40"
          y1="14"
          x2="40"
          y2="6"
          stroke="var(--color-accent-glow)"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${deg} 40 40)`}
        />
      ))}
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  illustration,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-[var(--space-md)] py-[var(--space-2xl)] text-center",
        className,
      ].join(" ")}
    >
      {illustration ? (
        <Illustration kind={illustration} />
      ) : icon ? (
        typeof icon === "string" ? (
          <div className="text-5xl" aria-hidden>
            {icon}
          </div>
        ) : (
          (() => {
            const Icon = icon;
            return (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-brand-50)] text-[color:var(--color-brand-600)]">
                <Icon size={28} aria-hidden />
              </div>
            );
          })()
        )
      ) : null}
      <div className="flex flex-col gap-[var(--space-2xs)]">
        <h3 className="text-[length:var(--text-title-2)] font-semibold text-[color:var(--color-text-primary)]">
          {title}
        </h3>
        {description && (
          <p className="max-w-sm text-[length:var(--text-body)] text-[color:var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {primaryAction && (
            <Button onClick={primaryAction.onClick} leadingIcon={primaryAction.icon}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="tertiary"
              onClick={secondaryAction.onClick}
              leadingIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
