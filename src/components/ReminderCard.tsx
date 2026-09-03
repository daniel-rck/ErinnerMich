import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, Clock, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { categoryClasses } from "../lib/categoryColors";
import { addEvent } from "../lib/db/events";
import { adjustInventory } from "../lib/db/inventories";
import { updateReminder } from "../lib/db/reminders";
import { useSwipeActions } from "../lib/design/gestures";
import { formatSchedule } from "../lib/format";
import { useInventory } from "../lib/hooks/useInventory";
import { snoozeOptions } from "../lib/schedule/snoozeOptions";
import type { Reminder } from "../lib/types";
import { vibrate } from "./ui/Haptic";
import { useToast } from "./ui/Toast";

interface ReminderCardProps {
  reminder: Reminder;
  scheduledFor?: Date;
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (reminder: Reminder) => void;
}

export function ReminderCard({ reminder, scheduledFor, onEdit, onDelete }: ReminderCardProps) {
  const toast = useToast();
  const { inventory } = useInventory(reminder.id);
  const tone = categoryClasses(reminder.category);
  const reducedMotion = useReducedMotion();

  const lowStock = inventory != null && inventory.remaining <= inventory.refillThreshold;

  async function complete() {
    const now = Date.now();
    vibrate("success");
    await addEvent({
      reminderId: reminder.id,
      action: "completed",
      triggeredAt: now,
      scheduledFor: scheduledFor?.getTime(),
    });
    if (reminder.schedule.type === "elapsed") {
      await updateReminder(reminder.id, {
        schedule: { ...reminder.schedule, lastDone: now },
      });
    }
    if (reminder.kind === "reminder") {
      await adjustInventory(reminder.id, -1);
    }
    toast.show({ variant: "success", message: `„${reminder.title}“ erledigt` });
  }

  async function snoozeAt(at: Date, label: string) {
    const now = Date.now();
    vibrate("tick");
    await addEvent({
      reminderId: reminder.id,
      action: "snoozed",
      triggeredAt: now,
      scheduledFor: scheduledFor?.getTime(),
      snoozeUntil: at.getTime(),
    });
    toast.show({ message: `Erneut ${label}` });
  }

  const swipe = useSwipeActions({
    onSwipeRight: () => {
      void complete();
    },
    rightColor: "var(--color-success-soft)",
    leftColor: "transparent",
  });

  // The card content (without any motion wrappers) — rendered as a plain
  // <article> when prefers-reduced-motion is set.
  const cardInner = (
    <>
      <header className="flex items-start gap-[0.75rem]">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.875rem] ${tone.iconBg} text-2xl`}
          aria-hidden
        >
          {reminder.icon}
        </span>
        <div className="flex flex-1 flex-col">
          <h3 className="text-[length:0.9375rem] font-semibold leading-tight text-[color:var(--color-fg)]">
            {reminder.title}
          </h3>
          <p className="text-[length:0.8125rem] text-[color:var(--color-fg-muted)]">
            {formatSchedule(reminder.schedule)}
          </p>
          {lowStock && inventory && (
            <p className="mt-1 inline-flex items-center gap-1 text-[length:0.8125rem] text-[color:var(--color-warning)]">
              <AlertTriangle size={12} aria-hidden />
              Nur noch {inventory.remaining} {inventory.unit}
            </p>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-[0.5rem]">
        <motion.button
          type="button"
          onClick={() => void complete()}
          whileTap={{ scale: 0.94 }}
          className={[
            "inline-flex items-center gap-1.5",
            "h-9 px-3 rounded-[0.875rem]",
            "bg-[color:var(--color-accent-600)] text-[color:white]",
            "shadow-[0 8px 24px oklch(54% 0.22 285 / 0.32)]",
            "text-[length:0.8125rem] font-semibold",
            "hover:bg-[color:var(--color-accent-700)]",
          ].join(" ")}
        >
          <Check size={14} aria-hidden />
          Erledigt
        </motion.button>
        <SnoozeMenu onPick={(at, label) => void snoozeAt(at, label)} />
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(reminder)}
            aria-label="Bearbeiten"
            className={[
              "ml-auto inline-flex items-center gap-1.5",
              "h-9 px-3 rounded-[0.875rem]",
              "text-[length:0.8125rem] text-[color:var(--color-fg-muted)]",
              "hover:bg-[color:var(--color-surface-sunken)]",
            ].join(" ")}
          >
            <Pencil size={14} aria-hidden />
            <span className="hidden sm:inline">Bearbeiten</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(reminder)}
            aria-label="Löschen"
            className={[
              "inline-flex items-center gap-1.5",
              "h-9 px-3 rounded-[0.875rem]",
              "text-[length:0.8125rem] text-[color:var(--color-danger)]",
              "hover:bg-[color:var(--color-danger-soft)]",
            ].join(" ")}
          >
            <Trash2 size={14} aria-hidden />
            <span className="hidden sm:inline">Löschen</span>
          </button>
        )}
      </div>
    </>
  );

  const cardClass = [
    "flex flex-col gap-[0.75rem]",
    "p-[1rem] rounded-[1.25rem]",
    "bg-[color:var(--color-surface)]",
    "border border-[color:var(--color-border)] border-l-4",
    tone.borderL,
    "shadow-[0 1px 2px oklch(20% 0.01 285 / 0.06), 0 1px 1px oklch(20% 0.01 285 / 0.04)]",
  ].join(" ");

  if (reducedMotion) {
    return <article className={cardClass}>{cardInner}</article>;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="relative overflow-hidden rounded-[1.25rem]"
      style={{ background: swipe.background }}
    >
      <motion.article
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        dragSnapToOrigin
        onDragEnd={swipe.onDragEnd}
        style={{ x: swipe.x, touchAction: "pan-y" }}
        className={`${cardClass} cursor-grab active:cursor-grabbing`}
      >
        {cardInner}
      </motion.article>
      <SwipeHint />
    </motion.div>
  );
}

function SwipeHint() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[0.75rem]"
      aria-hidden
    >
      <span className="flex items-center gap-1 text-[length:0.8125rem] font-medium text-[color:var(--color-success)] opacity-0 transition-opacity">
        <Check size={14} />
        Erledigt
      </span>
    </div>
  );
}

function SnoozeMenu({ onPick }: { onPick: (at: Date, label: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverId = useId();
  const options = snoozeOptions();

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={popoverId}
        className={[
          "inline-flex items-center gap-1.5",
          "h-9 px-3 rounded-[0.875rem]",
          "bg-[color:var(--color-surface)]",
          "border border-[color:var(--color-border)]",
          "text-[length:0.8125rem] font-medium text-[color:var(--color-fg)]",
          "hover:bg-[color:var(--color-surface-sunken)]",
        ].join(" ")}
      >
        <Clock size={14} aria-hidden />
        Snooze
      </button>
      {open && (
        <fieldset
          id={popoverId}
          aria-label="Snooze-Optionen"
          className={[
            "absolute z-10 mt-1 flex min-w-[14rem] flex-col py-1",
            "rounded-[0.875rem]",
            "bg-[color:var(--color-surface)]",
            "border border-[color:var(--color-border)]",
            "shadow-[0 4px 12px oklch(20% 0.01 285 / 0.08), 0 2px 4px oklch(20% 0.01 285 / 0.04)]",
          ].join(" ")}
        >
          {options.map(({ key, label, at }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onPick(at, label);
                setOpen(false);
              }}
              className="block w-full px-3 py-1.5 text-left text-[length:0.9375rem] text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-sunken)]"
            >
              {label}
            </button>
          ))}
        </fieldset>
      )}
    </div>
  );
}
