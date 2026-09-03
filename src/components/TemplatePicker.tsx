import { useState } from "react";
import { HABIT_TEMPLATES, REMINDER_TEMPLATES, type Template } from "../lib/templates";

interface TemplatePickerProps {
  onPick: (template: Template) => void;
  onPickBlank?: (kind: "reminder" | "habit") => void;
}

type Tab = "reminder" | "habit";

export function TemplatePicker({ onPick, onPickBlank }: TemplatePickerProps) {
  const [tab, setTab] = useState<Tab>("reminder");
  const list = tab === "reminder" ? REMINDER_TEMPLATES : HABIT_TEMPLATES;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Vorlage-Kategorie"
        className="flex gap-1 rounded-lg bg-surface-sunken p-1"
      >
        <TabButton active={tab === "reminder"} onClick={() => setTab("reminder")}>
          Erinnern
        </TabButton>
        <TabButton active={tab === "habit"} onClick={() => setTab("habit")}>
          Habit / Tracken
        </TabButton>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {list.map((template) => (
          <button
            key={template.key}
            type="button"
            onClick={() => onPick(template)}
            className="flex flex-col items-start gap-1 rounded-lg border border-border bg-surface p-3 text-left hover:border-accent-400 hover:bg-accent-50 dark:hover:border-accent-500 dark:hover:bg-accent-900/30"
          >
            <span className="text-2xl" aria-hidden>
              {template.icon}
            </span>
            <span className="font-medium">{template.title}</span>
            {template.description && (
              <span className="text-xs text-fg-muted">{template.description}</span>
            )}
          </button>
        ))}
        {onPickBlank && (
          <button
            type="button"
            onClick={() => onPickBlank(tab)}
            className="flex flex-col items-start gap-1 rounded-lg border border-dashed border-border p-3 text-left text-fg-muted hover:border-accent-400 hover:text-accent-700 dark:hover:text-accent-400"
          >
            <span className="text-2xl" aria-hidden>
              ➕
            </span>
            <span className="font-medium">Eigener Eintrag</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
        (active ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg")
      }
    >
      {children}
    </button>
  );
}
