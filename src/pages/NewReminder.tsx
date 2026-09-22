import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ReminderForm } from "../components/ReminderForm";
import { TemplatePicker } from "../components/TemplatePicker";
import { useBack } from "../components/useBack";
import { ALL_TEMPLATES, type Template } from "../lib/templates";
import type { ReminderKind } from "../lib/types";

/**
 * Query parameters:
 * - `kind`: which template tab opens first (and the kind of a blank entry)
 * - `template=<key>`: skip the picker and prefill from that template
 * - `blank=1`: skip the picker with an empty form
 * - `title`: skip the picker with a prefilled title (quick capture)
 */
export function NewReminderPage() {
  const navigate = useNavigate();
  const back = useBack("/");
  const [params] = useSearchParams();
  const initialKind = useMemo<ReminderKind>(() => {
    const k = params.get("kind");
    return k === "habit" || k === "mood" ? k : "reminder";
  }, [params]);
  const initialTitle = useMemo(() => params.get("title") ?? undefined, [params]);
  const initialTemplate = useMemo(
    () => ALL_TEMPLATES.find((t) => t.key === params.get("template")),
    [params],
  );
  const skipPicker = initialTemplate !== undefined || !!initialTitle || params.get("blank") === "1";

  const [step, setStep] = useState<"pick" | "edit">(skipPicker ? "edit" : "pick");
  const [template, setTemplate] = useState<Template | undefined>(initialTemplate);
  const [kind, setKind] = useState<ReminderKind>(initialTemplate?.kind ?? initialKind);

  function pickTemplate(t: Template) {
    setTemplate(t);
    setKind(t.kind);
    setStep("edit");
  }

  function pickBlank(k: "reminder" | "habit") {
    setTemplate(undefined);
    setKind(k);
    setStep("edit");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {step === "pick"
          ? "Vorlage wählen"
          : template
            ? template.title
            : (initialTitle ?? (kind === "habit" ? "Neues Habit" : "Neue Erinnerung"))}
      </h1>
      {step === "pick" ? (
        <TemplatePicker
          initialTab={initialKind === "habit" ? "habit" : "reminder"}
          onPick={pickTemplate}
          onPickBlank={pickBlank}
        />
      ) : (
        <ReminderForm
          template={template}
          kind={kind}
          initialTitle={initialTitle}
          // Replace: "Zurück" after saving must not reopen an empty form.
          onSaved={() => navigate(kind === "habit" ? "/library" : "/", { replace: true })}
          onCancel={back}
        />
      )}
    </div>
  );
}
