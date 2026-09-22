import { useState } from "react";
import { useConfirm } from "../components/ui/Confirm";
import { useToast } from "../components/ui/Toast";
import {
  type LandingTab,
  readSettings,
  writeLandingTab,
  writeNotificationOnboardingDone,
  writeWellnessToolsEnabled,
} from "../lib/db/settings";
import { downloadExport, ImportSchemaError, importAll, parseExport } from "../lib/io/exportImport";
import {
  ensureNotificationPermission,
  getNotificationSupport,
  isIosWithoutStandalone,
} from "../lib/notifications/permission";
import { rearmAll, schedulerStatus, showTestNotification } from "../lib/notifications/scheduler";
import { useTheme } from "../lib/ui/useTheme";

interface SettingsPageProps {
  embedded?: boolean;
}

export function SettingsPage({ embedded = false }: SettingsPageProps = {}) {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [landing, setLanding] = useState<LandingTab>(() => readSettings().defaultLandingTab);
  const [wellness, setWellness] = useState<boolean>(() => readSettings().wellnessToolsEnabled);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    const support = getNotificationSupport();
    return support.state === "unsupported" ? "unsupported" : support.permission;
  });
  const [showIosHint, setShowIosHint] = useState<boolean>(() => isIosWithoutStandalone());
  const status = schedulerStatus();

  function pickLanding(next: LandingTab) {
    setLanding(next);
    writeLandingTab(next);
  }

  function toggleWellness(next: boolean) {
    setWellness(next);
    writeWellnessToolsEnabled(next);
  }

  async function requestPermission() {
    const result = await ensureNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      writeNotificationOnboardingDone(true);
      await rearmAll();
    }
  }

  async function triggerTest() {
    if (permission !== "granted") return;
    const ok = await showTestNotification(10_000);
    toast.show({
      variant: ok ? "success" : "error",
      message: ok ? "Test-Benachrichtigung in ~10s." : "Konnte Test-Benachrichtigung nicht planen.",
    });
  }

  return (
    <div className="flex flex-col gap-[2rem]">
      {!embedded && (
        <header className="flex flex-col gap-[0.25rem]">
          <p className="text-[length:0.6875rem] tracking-[0.06em] uppercase font-medium text-[color:var(--color-fg-subtle)]">
            Du
          </p>
          <h1 className="text-[length:clamp(2rem,5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[color:var(--color-fg)]">
            Einstellungen
          </h1>
        </header>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-fg-muted uppercase">Erscheinungsbild</h2>
        <div className="flex flex-wrap gap-2">
          <ChoiceButton active={theme === "system"} onClick={() => setTheme("system")}>
            Wie System
          </ChoiceButton>
          <ChoiceButton active={theme === "light"} onClick={() => setTheme("light")}>
            Hell
          </ChoiceButton>
          <ChoiceButton active={theme === "dark"} onClick={() => setTheme("dark")}>
            Dunkel
          </ChoiceButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-fg-muted uppercase">Standard-Startseite</h2>
        <div className="flex flex-wrap gap-2">
          <ChoiceButton active={landing === "today"} onClick={() => pickLanding("today")}>
            Heute
          </ChoiceButton>
          <ChoiceButton active={landing === "habits"} onClick={() => pickLanding("habits")}>
            Habits
          </ChoiceButton>
          <ChoiceButton active={landing === "mood"} onClick={() => pickLanding("mood")}>
            Stimmung
          </ChoiceButton>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-fg-muted uppercase">Benachrichtigungen</h2>
        <NotificationStatus permission={permission} status={status} />

        <div className="flex flex-wrap gap-2">
          {permission === "default" && (
            <button
              type="button"
              onClick={requestPermission}
              className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-fg-on-accent hover:bg-accent-700"
            >
              Berechtigung anfragen
            </button>
          )}
          <button
            type="button"
            onClick={triggerTest}
            disabled={permission !== "granted"}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
          >
            Test in 10s
          </button>
        </div>
      </section>

      {showIosHint && (
        <section className="flex flex-col gap-2 rounded-lg border border-[color:var(--color-warning)] bg-[color:var(--color-warning-soft)] p-4 text-sm text-fg">
          <h2 className="font-medium text-warning-fg">iOS: Zum Homescreen hinzufügen</h2>
          <p>
            Auf iPhone/iPad liefert der Browser nur dann Benachrichtigungen, wenn ErinnerMich als
            Web-App installiert ist. Tippe auf <em>Teilen</em>
            {" → "}
            <em>Zum Home-Bildschirm</em>.
          </p>
          <button
            type="button"
            onClick={() => setShowIosHint(false)}
            className="self-start rounded-md border border-[color:var(--color-warning)] px-2 py-1 text-xs hover:bg-surface"
          >
            Ausblenden
          </button>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-fg-muted uppercase">Stimmung &amp; Wellness</h2>
        <p className="text-sm text-fg-muted">
          Stimmungs-Tracking sowie Atemübung, 5-4-3-2-1 Erden, Dankbarkeits-Glas, Schatzkiste,
          Sorgen-Box und Affirmationen — direkt in der App. Bei „Aus" verschwinden Stimmungs-Strip,
          der Stimmung-Tab und die Wellness-Tools komplett aus der Oberfläche.
        </p>
        <div className="flex gap-2">
          <ChoiceButton active={wellness} onClick={() => toggleWellness(true)}>
            An
          </ChoiceButton>
          <ChoiceButton active={!wellness} onClick={() => toggleWellness(false)}>
            Aus
          </ChoiceButton>
        </div>
      </section>

      <DataIO />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-fg-muted uppercase">Datenschutz</h2>
        <p className="text-sm text-fg-muted">
          Alle Daten bleiben ausschließlich in deinem Browser (IndexedDB + localStorage). Es gibt
          keine Cookies, kein Analytics, keine Tracker. DSGVO-konform per Default.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-fg-muted">
        <p>ErinnerMich · Daten werden ausschließlich lokal in deinem Browser gespeichert.</p>
        <p>Keine Cookies · Kein Tracking · DSGVO-konform</p>
      </section>
    </div>
  );
}

function DataIO() {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  async function doExport() {
    setBusy(true);
    try {
      const snap = await downloadExport();
      toast.show({
        variant: "success",
        message: `Export: ${snap.reminders.length} Einträge, ${snap.events.length} Ereignisse, ${snap.moodEntries.length} Stimmungen, ${snap.toolEntries.length} Tool-Einträge.`,
      });
    } catch (err) {
      toast.show({
        variant: "error",
        message: err instanceof Error ? err.message : "Export fehlgeschlagen.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File, mode: "merge" | "replace") {
    setBusy(true);
    try {
      const text = await file.text();
      const data = parseExport(JSON.parse(text));
      if (mode === "replace") {
        const ok = await confirm({
          title: "Daten ersetzen?",
          message:
            "Alle bestehenden Daten werden überschrieben. Dieser Schritt ist nicht rückgängig.",
          confirmLabel: "Ersetzen",
          destructive: true,
        });
        if (!ok) {
          setBusy(false);
          return;
        }
      }
      const summary = await importAll(data, { mode });
      toast.show({
        variant: "success",
        message: `${mode === "replace" ? "Ersetzt" : "Zusammengeführt"}: ${summary.reminders} Einträge, ${summary.events} Ereignisse, ${summary.moodEntries} Stimmungen, ${summary.toolEntries} Tool-Einträge.`,
      });
    } catch (err) {
      const text =
        err instanceof ImportSchemaError
          ? `Datei passt nicht: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Import fehlgeschlagen.";
      toast.show({ variant: "error", message: text });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-fg-muted uppercase">Daten Export / Import</h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={doExport}
          disabled={busy}
          className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-fg-on-accent hover:bg-accent-700 disabled:opacity-50"
        >
          Export (JSON)
        </button>
        <ImportButton mode="merge" onFile={handleFile} disabled={busy}>
          Import (Zusammenführen)
        </ImportButton>
        <ImportButton mode="replace" onFile={handleFile} disabled={busy}>
          Import (Ersetzen)
        </ImportButton>
      </div>
    </section>
  );
}

function ImportButton({
  mode,
  onFile,
  disabled,
  children,
}: {
  mode: "merge" | "replace";
  onFile: (file: File, mode: "merge" | "replace") => Promise<void>;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={
        "inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-sunken focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-500 " +
        (disabled ? "pointer-events-none opacity-50" : "")
      }
    >
      {/* sr-only, not hidden: `display:none` took the input out of the tab order. */}
      <input
        type="file"
        accept="application/json,.json"
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file, mode);
          event.target.value = "";
        }}
      />
      {children}
    </label>
  );
}

function NotificationStatus({
  permission,
  status,
}: {
  permission: NotificationPermission | "unsupported";
  status: ReturnType<typeof schedulerStatus>;
}) {
  if (permission === "unsupported") {
    return (
      <p className="text-sm text-fg-muted">Dein Browser unterstützt keine Benachrichtigungen.</p>
    );
  }
  if (permission === "denied") {
    return (
      <p className="text-sm text-danger-fg">
        Benachrichtigungen sind blockiert. Aktiviere sie in den Browser-Einstellungen, um
        Erinnerungen zu erhalten.
      </p>
    );
  }
  if (permission === "default") {
    return (
      <p className="text-sm text-fg-muted">
        Bitte erlaube Benachrichtigungen, damit deine Erinnerungen rechtzeitig kommen.
      </p>
    );
  }
  const modeLabel =
    status.mode === "triggers"
      ? "auch im Hintergrund"
      : status.mode === "in-tab"
        ? "nur solange die App geöffnet ist"
        : "nicht verfügbar";
  return <p className="text-sm text-success-fg">Aktiv · Modus: {modeLabel}</p>;
}

function ChoiceButton({
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
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-md border px-3 py-1.5 text-sm " +
        (active
          ? "border-accent-500 bg-accent-soft text-fg"
          : "border-border hover:bg-surface-sunken")
      }
    >
      {children}
    </button>
  );
}
