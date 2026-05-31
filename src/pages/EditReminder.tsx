import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReminderForm } from "../components/ReminderForm";
import { getReminder } from "../lib/db/reminders";
import type { Reminder } from "../lib/types";

export function EditReminderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      const result = await getReminder(id);
      if (cancelled) return;
      if (!result) setNotFound(true);
      else setReminder(result);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-zinc-500">Lade …</p>;
  if (notFound || !reminder) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Eintrag nicht gefunden.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{reminder.title} bearbeiten</h1>
      <ReminderForm
        initial={reminder}
        kind={reminder.kind}
        onSaved={() => navigate(-1)}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
