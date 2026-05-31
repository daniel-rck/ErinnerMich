import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ReminderForm } from "../components/ReminderForm";
import { TemplatePicker } from "../components/TemplatePicker";
import type { Template } from "../lib/templates";
import type { ReminderKind } from "../lib/types";

export function NewReminderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialKind = useMemo<ReminderKind>(() => {
    const k = params.get("kind");
    return k === "habit" || k === "mood" ? k : "reminder";
  }, [params]);
  const initialTitle = useMemo(() => params.get("title") ?? undefined, [params]);

  const [step, setStep] = useState<"pick" | "edit">(initialTitle ? "edit" : "pick");
  const [template, setTemplate] = useState<Template | undefined>(undefined);
  const [kind, setKind] = useState<ReminderKind>(initialKind);

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
            : (initialTitle ?? "Neuer Eintrag")}
      </h1>
      {step === "pick" ? (
        <TemplatePicker onPick={pickTemplate} onPickBlank={pickBlank} />
      ) : (
        <ReminderForm
          template={template}
          kind={kind}
          initialTitle={initialTitle}
          onSaved={() => navigate(kind === "habit" ? "/habits" : "/")}
          onCancel={() => navigate(-1)}
        />
      )}
    </div>
  );
}
