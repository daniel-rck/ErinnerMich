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
        className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
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
            className="flex flex-col items-start gap-1 rounded-lg border border-zinc-200 bg-white p-3 text-left hover:border-brand-400 hover:bg-brand-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-500 dark:hover:bg-brand-950/30"
          >
            <span className="text-2xl" aria-hidden>
              {template.icon}
            </span>
            <span className="font-medium">{template.title}</span>
            {template.description && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {template.description}
              </span>
            )}
          </button>
        ))}
        {onPickBlank && (
          <button
            type="button"
            onClick={() => onPickBlank(tab)}
            className="flex flex-col items-start gap-1 rounded-lg border border-dashed border-zinc-300 p-3 text-left text-zinc-500 hover:border-brand-400 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-brand-400"
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
        (active
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
      }
    >
      {children}
    </button>
  );
}
