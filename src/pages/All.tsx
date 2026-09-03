import { MoreVertical, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CardSkeleton } from "../components/ui/CardSkeleton";
import { useToast } from "../components/ui/Toast";
import { categoryClasses } from "../lib/categoryColors";
import {
  archiveReminder,
  deleteReminder,
  restoreReminder,
  setReminderActive,
} from "../lib/db/reminders";
import { formatSchedule } from "../lib/format";
import { useReminders } from "../lib/hooks/useReminders";
import type { Reminder, ReminderKind } from "../lib/types";

type Filter = "all" | ReminderKind;

const DELETE_GRACE_MS = 5500;

interface AllPageProps {
  /**
   * When true, omits the page header (used inside Library tabs).
   */
  embedded?: boolean;
  /**
   * Pre-applied filter when no URL param is set — used to scope the "Reminder"
   * tab inside Library.
   */
  defaultFilter?: ReminderKind;
}

export function AllPage({ embedded = false, defaultFilter }: AllPageProps = {}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const filter: Filter = (() => {
    const f = params.get("filter");
    if (f === "reminder" || f === "habit" || f === "mood") return f;
    return defaultFilter ?? "all";
  })();
  const search = params.get("q") ?? "";
  const { reminders, loading } = useReminders({
    kind: filter === "all" ? undefined : filter,
  });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length === 0) return reminders;
    return reminders.filter(
      (r) => r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q),
    );
  }, [reminders, search]);

  function setFilter(next: Filter) {
    const np = new URLSearchParams(params);
    if (next === "all") np.delete("filter");
    else np.set("filter", next);
    setParams(np, { replace: true });
  }

  function setSearch(next: string) {
    const np = new URLSearchParams(params);
    if (next.length === 0) np.delete("q");
    else np.set("q", next);
    setParams(np, { replace: true });
  }

  async function handleDelete(reminder: Reminder) {
    await archiveReminder(reminder.id);
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      void deleteReminder(reminder.id);
    }, DELETE_GRACE_MS);
    toast.show({
      variant: "success",
      message: `„${reminder.title}“ gelöscht`,
      durationMs: DELETE_GRACE_MS,
      action: {
        label: "Rückgängig",
        onClick: () => {
          cancelled = true;
          clearTimeout(timer);
          void restoreReminder(reminder.id);
        },
      },
    });
  }

  return (
    <div className="flex flex-col gap-[1rem]">
      {!embedded && (
        <header className="flex items-end justify-between">
          <div className="flex flex-col gap-[0.25rem]">
            <p className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
              Bibliothek
            </p>
            <h1 className="text-[length:clamp(2rem,5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[color:var(--color-fg)]">
              Alle
            </h1>
          </div>
        </header>
      )}

      <div className="flex items-center gap-2 rounded-[0.875rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-[0.75rem]">
        <Search size={16} className="text-fg-subtle" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen …"
          aria-label="Suchen"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm focus:outline-none"
        />
      </div>

      <fieldset aria-label="Filter" className="flex gap-1 rounded-lg bg-surface-sunken p-1">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Alle
        </FilterButton>
        <FilterButton active={filter === "reminder"} onClick={() => setFilter("reminder")}>
          Erinnerungen
        </FilterButton>
        <FilterButton active={filter === "habit"} onClick={() => setFilter("habit")}>
          Habits
        </FilterButton>
        <FilterButton active={filter === "mood"} onClick={() => setFilter("mood")}>
          Mood
        </FilterButton>
      </fieldset>

      {loading ? (
        <CardSkeleton variant="row" count={4} />
      ) : visible.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((reminder) => (
            <RowItem
              key={reminder.id}
              reminder={reminder}
              onOpen={() => navigate(`/detail/${reminder.id}`)}
              onEdit={() => navigate(`/edit/${reminder.id}`)}
              onToggleActive={() => setReminderActive(reminder.id, !reminder.active)}
              onDelete={() => handleDelete(reminder)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  if (search.trim().length > 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-fg-muted">
        Keine Treffer für „{search}“.
      </p>
    );
  }
  return (
    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-fg-muted">
      Hier landen alle Reminder, Habits und Mood-Einträge.
    </p>
  );
}

function RowItem({
  reminder,
  onOpen,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  reminder: Reminder;
  onOpen: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const tone = categoryClasses(reminder.category);

  return (
    <li
      className={`flex items-center gap-3 rounded-lg border border-l-4 ${tone.borderL} border-border bg-surface p-3`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-center gap-3 text-left no-min-tap"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone.iconBg} text-xl`}
          aria-hidden
        >
          {reminder.icon}
        </span>
        <div className="flex flex-1 flex-col">
          <span className="font-medium">{reminder.title}</span>
          <span className="text-xs text-fg-muted">
            {formatSchedule(reminder.schedule)}
            {!reminder.active && " · pausiert"}
          </span>
        </div>
      </button>
      <RowMenu
        active={reminder.active}
        onToggleActive={onToggleActive}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </li>
  );
}

function RowMenu({
  active,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  active: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

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

  function pick(action: () => void) {
    return () => {
      setOpen(false);
      action();
    };
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Optionen"
        className="flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-sunken"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 flex min-w-[10rem] flex-col rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={pick(onToggleActive)}
            className="px-3 py-1.5 text-left text-sm hover:bg-surface-sunken"
          >
            {active ? "Pausieren" : "Aktivieren"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onEdit)}
            className="px-3 py-1.5 text-left text-sm hover:bg-surface-sunken"
          >
            Bearbeiten
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onDelete)}
            className="px-3 py-1.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Löschen
          </button>
        </div>
      )}
    </div>
  );
}

function FilterButton({
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
      aria-pressed={active}
      onClick={onClick}
      className={
        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium " +
        (active ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg")
      }
    >
      {children}
    </button>
  );
}
