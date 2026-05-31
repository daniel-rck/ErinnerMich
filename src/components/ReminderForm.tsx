import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createReminder, updateReminder } from "../lib/db/reminders";
import { readSettings, writeNotificationOnboardingDone } from "../lib/db/settings";
import { formatSchedule } from "../lib/format";
import { ensureNotificationPermission } from "../lib/notifications/permission";
import { lastDayOfMonth } from "../lib/schedule/helpers";
import type { Template } from "../lib/templates";
import type { HabitGoal, Reminder, ReminderKind, Schedule, Weekday } from "../lib/types";
import { SchedulePreview } from "./SchedulePreview";
import { useConfirm } from "./ui/Confirm";
import { IconPicker } from "./ui/IconPicker";

const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: "MON", label: "Mo" },
  { value: "TUE", label: "Di" },
  { value: "WED", label: "Mi" },
  { value: "THU", label: "Do" },
  { value: "FRI", label: "Fr" },
  { value: "SAT", label: "Sa" },
  { value: "SUN", label: "So" },
];

const EDITABLE_TYPES = ["interval", "daily", "weekly", "monthly", "yearly", "elapsed"] as const;
type EditableType = (typeof EDITABLE_TYPES)[number];

interface ReminderFormProps {
  initial?: Reminder;
  template?: Template;
  kind: ReminderKind;
  initialTitle?: string;
  onSaved: (reminder: Reminder) => void;
  onCancel?: () => void;
}

export function ReminderForm({
  initial,
  template,
  kind,
  initialTitle,
  onSaved,
  onCancel,
}: ReminderFormProps) {
  const [title, setTitle] = useState(initial?.title ?? initialTitle ?? template?.title ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? template?.icon ?? "⏰");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [schedule, setSchedule] = useState<Schedule>(
    initial?.schedule ?? template?.defaultSchedule ?? { type: "daily", times: ["09:00"] },
  );
  const [goal, setGoal] = useState<HabitGoal | undefined>(
    initial?.goal ?? template?.defaultGoal ?? (kind === "habit" ? { type: "binary" } : undefined),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: initial?.title ?? initialTitle ?? template?.title ?? "",
        icon: initial?.icon ?? template?.icon ?? "⏰",
        description: initial?.description ?? "",
        schedule: initial?.schedule ??
          template?.defaultSchedule ?? {
            type: "daily",
            times: ["09:00"],
          },
        goal:
          initial?.goal ??
          template?.defaultGoal ??
          (kind === "habit" ? { type: "binary" } : undefined),
      }),
    [initial, initialTitle, template, kind],
  );
  const isDirty = JSON.stringify({ title, icon, description, schedule, goal }) !== initialSnapshot;

  const isReadOnlySchedule = !EDITABLE_TYPES.includes(schedule.type as EditableType);

  async function handleCancel() {
    if (!onCancel) return;
    if (!isDirty) {
      onCancel();
      return;
    }
    const ok = await confirm({
      title: "Änderungen verwerfen?",
      message: "Deine Änderungen gehen dabei verloren.",
      confirmLabel: "Verwerfen",
      destructive: true,
    });
    if (ok) onCancel();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Titel darf nicht leer sein");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (initial) {
        const updated = await updateReminder(initial.id, {
          title: title.trim(),
          icon,
          description: description.trim() || undefined,
          schedule,
          goal: kind === "habit" ? goal : undefined,
        });
        onSaved(updated);
      } else {
        const created = await createReminder({
          kind,
          title: title.trim(),
          icon,
          description: description.trim() || undefined,
          category: template?.category ?? "other",
          color: template?.color ?? "emerald",
          schedule,
          goal: kind === "habit" ? goal : undefined,
          streakSensitive: kind === "habit",
          active: true,
        });
        if (!readSettings().notificationOnboardingDone) {
          const result = await ensureNotificationPermission();
          if (result === "granted") writeNotificationOnboardingDone(true);
        }
        onSaved(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <FieldGroup label="Symbol" className="w-auto">
          <IconPicker value={icon} onChange={setIcon} ariaLabel="Symbol wählen" />
        </FieldGroup>
        <FieldGroup label="Titel" className="flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            required
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Notiz (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          rows={2}
        />
      </FieldGroup>

      {kind === "habit" && (
        <FieldGroup label="Ziel">
          <HabitGoalEditor goal={goal} onChange={setGoal} />
        </FieldGroup>
      )}

      <FieldGroup label="Wiederholung">
        {isReadOnlySchedule ? (
          <div className="rounded-md border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            {formatSchedule(schedule)} — wird in einer späteren Version editierbar.
          </div>
        ) : (
          <ScheduleEditor schedule={schedule} onChange={setSchedule} />
        )}
      </FieldGroup>

      <SchedulePreview schedule={schedule} />

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
        >
          {initial ? "Speichern" : "Anlegen"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-900";

function FieldGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: Schedule;
  onChange: (s: Schedule) => void;
}) {
  function pickType(type: EditableType) {
    onChange(defaultForType(type));
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={schedule.type}
        onChange={(e) => pickType(e.target.value as EditableType)}
        className={inputClass}
      >
        <option value="daily">Täglich</option>
        <option value="weekly">Wöchentlich</option>
        <option value="monthly">Monatlich</option>
        <option value="yearly">Jährlich</option>
        <option value="elapsed">Alle X Tage</option>
        <option value="interval">Intervall (Minuten)</option>
      </select>

      {schedule.type === "daily" && <DailyEditor schedule={schedule} onChange={onChange} />}
      {schedule.type === "weekly" && <WeeklyEditor schedule={schedule} onChange={onChange} />}
      {schedule.type === "monthly" && <MonthlyEditor schedule={schedule} onChange={onChange} />}
      {schedule.type === "yearly" && <YearlyEditor schedule={schedule} onChange={onChange} />}
      {schedule.type === "elapsed" && <ElapsedEditor schedule={schedule} onChange={onChange} />}
      {schedule.type === "interval" && <IntervalEditor schedule={schedule} onChange={onChange} />}
    </div>
  );
}

function defaultForType(type: EditableType): Schedule {
  switch (type) {
    case "daily":
      return { type: "daily", times: ["09:00"] };
    case "weekly":
      return { type: "weekly", days: ["MON"], time: "09:00" };
    case "monthly":
      return { type: "monthly", dayOfMonth: 1, time: "09:00" };
    case "yearly":
      return { type: "yearly", month: 1, day: 1, time: "09:00" };
    case "elapsed":
      return { type: "elapsed", days: 7 };
    case "interval":
      return { type: "interval", minutes: 90 };
  }
}

function DailyEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: "daily" }>;
  onChange: (s: Schedule) => void;
}) {
  function update(times: string[]) {
    onChange({ ...schedule, times });
  }
  function addTime() {
    const fallback = schedule.times.length === 0 ? "09:00" : "20:00";
    update([...schedule.times, fallback]);
  }
  function removeAt(idx: number) {
    update(schedule.times.filter((_, i) => i !== idx));
  }
  function setAt(idx: number, value: string) {
    update(schedule.times.map((t, i) => (i === idx ? value : t)));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {schedule.times.map((time, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white pl-2 pr-1 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <input
            type="time"
            value={time}
            onChange={(e) => setAt(idx, e.target.value)}
            aria-label={`Zeit ${idx + 1}`}
            className="min-w-[5.5rem] bg-transparent py-1 text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeAt(idx)}
            aria-label={`Zeit ${idx + 1} entfernen`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={14} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={addTime}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:border-accent-400 hover:text-accent-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-accent-500 dark:hover:text-accent-300"
      >
        <Plus size={14} />
        Zeit hinzufügen
      </button>
    </div>
  );
}

function WeeklyEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: "weekly" }>;
  onChange: (s: Schedule) => void;
}) {
  function toggleDay(day: Weekday) {
    const days = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day];
    onChange({ ...schedule, days });
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {WEEKDAY_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleDay(value)}
            className={
              "rounded-md border px-3 py-1.5 text-sm " +
              (schedule.days.includes(value)
                ? "border-accent-500 bg-accent-100 text-accent-900 dark:bg-accent-900/40 dark:text-accent-100"
                : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800")
            }
          >
            {label}
          </button>
        ))}
      </div>
      <input
        type="time"
        value={schedule.time}
        onChange={(e) => onChange({ ...schedule, time: e.target.value })}
        className={inputClass}
      />
    </div>
  );
}

function MonthlyEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: "monthly" }>;
  onChange: (s: Schedule) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1 sm:grid-cols-10">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onChange({ ...schedule, dayOfMonth: day })}
            className={
              "rounded-md border px-2 py-1.5 text-sm tabular-nums no-min-tap " +
              (schedule.dayOfMonth === day
                ? "border-accent-500 bg-accent-100 text-accent-900 dark:bg-accent-900/40 dark:text-accent-100"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600")
            }
            aria-pressed={schedule.dayOfMonth === day}
            aria-label={`Tag ${day}`}
          >
            {day}
          </button>
        ))}
      </div>
      <input
        type="time"
        value={schedule.time}
        onChange={(e) => onChange({ ...schedule, time: e.target.value })}
        className={inputClass}
        aria-label="Uhrzeit"
      />
    </div>
  );
}

const MONTH_LABELS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const LEAD_QUICK = [0, 1, 7, 30, 365] as const;

function YearlyEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: "yearly" }>;
  onChange: (s: Schedule) => void;
}) {
  const maxDay = lastDayOfMonth(2024, schedule.month - 1);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={schedule.month}
          onChange={(e) => {
            const newMonth = Number(e.target.value);
            const max = lastDayOfMonth(2024, newMonth - 1);
            onChange({
              ...schedule,
              month: newMonth,
              day: Math.min(schedule.day, max),
            });
          }}
          className={inputClass + " w-auto"}
          aria-label="Monat"
        >
          {MONTH_LABELS.map((label, idx) => (
            <option key={idx} value={idx + 1}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={schedule.time}
          onChange={(e) => onChange({ ...schedule, time: e.target.value })}
          className={inputClass + " w-auto"}
          aria-label="Uhrzeit"
        />
      </div>
      <div className="grid grid-cols-7 gap-1 sm:grid-cols-10">
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onChange({ ...schedule, day })}
            className={
              "rounded-md border px-2 py-1.5 text-sm tabular-nums no-min-tap " +
              (schedule.day === day
                ? "border-accent-500 bg-accent-100 text-accent-900 dark:bg-accent-900/40 dark:text-accent-100"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600")
            }
            aria-pressed={schedule.day === day}
            aria-label={`Tag ${day}`}
          >
            {day}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Vorlauf</span>
        <div className="flex flex-wrap gap-1.5">
          {LEAD_QUICK.map((d) => {
            const active = (schedule.leadDays ?? 0) === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ ...schedule, leadDays: d === 0 ? undefined : d })}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (active
                    ? "border-accent-500 bg-accent-100 text-accent-900 dark:bg-accent-900/40 dark:text-accent-100"
                    : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600")
                }
                aria-pressed={active}
              >
                {d === 0 ? "kein Vorlauf" : `${d} Tage`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const ELAPSED_QUICK = [3, 7, 14, 30, 90] as const;

function ElapsedEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: "elapsed" }>;
  onChange: (s: Schedule) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {ELAPSED_QUICK.map((d) => {
          const active = schedule.days === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ ...schedule, days: d })}
              className={
                "rounded-full border px-3 py-1 text-sm " +
                (active
                  ? "border-accent-500 bg-accent-100 text-accent-900 dark:bg-accent-900/40 dark:text-accent-100"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600")
              }
              aria-pressed={active}
            >
              alle {d} Tage
            </button>
          );
        })}
      </div>
      <input
        type="number"
        min={1}
        value={schedule.days}
        onChange={(e) => onChange({ ...schedule, days: Number(e.target.value) })}
        className={inputClass}
        aria-label="Eigene Anzahl Tage"
      />
    </div>
  );
}

const INTERVAL_QUICK = [30, 60, 90, 120, 240] as const;

function IntervalEditor({
  schedule,
  onChange,
}: {
  schedule: Extract<Schedule, { type: "interval" }>;
  onChange: (s: Schedule) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {INTERVAL_QUICK.map((m) => {
          const active = schedule.minutes === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ ...schedule, minutes: m })}
              className={
                "rounded-full border px-3 py-1 text-sm " +
                (active
                  ? "border-accent-500 bg-accent-100 text-accent-900 dark:bg-accent-900/40 dark:text-accent-100"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600")
              }
              aria-pressed={active}
            >
              alle {m >= 60 ? `${m / 60} h` : `${m} min`}
            </button>
          );
        })}
      </div>
      <input
        type="number"
        min={1}
        value={schedule.minutes}
        onChange={(e) => onChange({ ...schedule, minutes: Number(e.target.value) })}
        className={inputClass}
        aria-label="Eigene Anzahl Minuten"
      />
    </div>
  );
}

const GOAL_PRESETS: { key: string; label: string; goal: HabitGoal }[] = [
  { key: "done", label: "✅ Erledigt / Nicht", goal: { type: "binary" } },
  {
    key: "water",
    label: "💧 8 Glas Wasser",
    goal: { type: "count", target: 8, unit: "Glas" },
  },
  {
    key: "steps",
    label: "🚶 10 000 Schritte",
    goal: { type: "count", target: 10000, unit: "Schritte" },
  },
  {
    key: "sport",
    label: "🏃 30 min Sport",
    goal: { type: "duration", targetMinutes: 30 },
  },
  {
    key: "read",
    label: "📚 20 min Lesen",
    goal: { type: "duration", targetMinutes: 20 },
  },
];

function goalsEqual(a: HabitGoal | undefined, b: HabitGoal): boolean {
  if (!a) return false;
  if (a.type !== b.type) return false;
  if (a.type === "binary") return true;
  if (a.type === "count" && b.type === "count") return a.target === b.target && a.unit === b.unit;
  if (a.type === "duration" && b.type === "duration") return a.targetMinutes === b.targetMinutes;
  return false;
}

function HabitGoalEditor({
  goal,
  onChange,
}: {
  goal: HabitGoal | undefined;
  onChange: (goal: HabitGoal) => void;
}) {
  const type = goal?.type ?? "binary";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {GOAL_PRESETS.map((preset) => {
          const active = goalsEqual(goal, preset.goal);
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onChange(preset.goal)}
              className={
                "rounded-full border px-3 py-1 text-sm " +
                (active
                  ? "border-accent-500 bg-accent-100 text-accent-900 dark:bg-accent-900/40 dark:text-accent-100"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600")
              }
              aria-pressed={active}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <select
        value={type}
        onChange={(e) => {
          const nextType = e.target.value as HabitGoal["type"];
          if (nextType === "binary") onChange({ type: "binary" });
          else if (nextType === "count") onChange({ type: "count", target: 8, unit: "Stück" });
          else onChange({ type: "duration", targetMinutes: 30 });
        }}
        className={inputClass}
        aria-label="Ziel-Typ"
      >
        <option value="binary">Erledigt / Nicht erledigt</option>
        <option value="count">Zähler (z.B. 8 Glas)</option>
        <option value="duration">Dauer (z.B. 30 min)</option>
      </select>
      {goal?.type === "count" && (
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={goal.target}
            onChange={(e) => onChange({ ...goal, target: Number(e.target.value) })}
            className={inputClass}
            aria-label="Ziel-Anzahl"
          />
          <input
            value={goal.unit}
            onChange={(e) => onChange({ ...goal, unit: e.target.value })}
            className={inputClass}
            placeholder="Einheit"
            aria-label="Einheit"
          />
        </div>
      )}
      {goal?.type === "duration" && (
        <input
          type="number"
          min={1}
          value={goal.targetMinutes}
          onChange={(e) => onChange({ ...goal, targetMinutes: Number(e.target.value) })}
          className={inputClass}
          aria-label="Ziel-Minuten"
        />
      )}
    </div>
  );
}
