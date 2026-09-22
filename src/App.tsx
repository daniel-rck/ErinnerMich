import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { MoodLogProvider } from "./components/MoodLog/MoodLogProvider";
import { Onboarding } from "./components/Onboarding";
import { ConfirmProvider } from "./components/ui/Confirm";
import { ToastProvider } from "./components/ui/Toast";
import { purgeArchivedReminders } from "./lib/db/reminders";
import { readSettings } from "./lib/db/settings";
import { NotificationsBootstrap } from "./lib/notifications/NotificationsBootstrap";
import { ToolsBootstrap } from "./lib/tools/ToolsBootstrap";
import { AllPage } from "./pages/All";
import { EditReminderPage } from "./pages/EditReminder";
import { HabitsPage } from "./pages/Habits";
import { LibraryPage } from "./pages/Library";
import { MoodPage } from "./pages/Mood";
import { NewReminderPage } from "./pages/NewReminder";
import { NotFoundPage } from "./pages/NotFound";
import { ReminderDetailPage } from "./pages/ReminderDetail";
import { SettingsPage } from "./pages/Settings";
import { StatsPage } from "./pages/Stats";
import { TodayPage } from "./pages/Today";
import { YouPage } from "./pages/You";

const ToolsPage = lazy(() => import("./pages/Tools").then((m) => ({ default: m.ToolsPage })));
const ToolSessionPage = lazy(() =>
  import("./pages/ToolSession").then((m) => ({ default: m.ToolSessionPage })),
);

function ToolsFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-fg-muted">
      Lade …
    </div>
  );
}

const LANDING_PATH = { today: "/", habits: "/library", mood: "/mood" } as const;

/**
 * Applies the "Standard-Startseite" setting once per app start: a plain launch
 * on "/" (no deep link, no query like `?notif=`) goes to the chosen tab.
 */
function LandingRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname !== "/" || location.search !== "") return;
    const settings = readSettings();
    const target = LANDING_PATH[settings.defaultLandingTab];
    if (target === "/mood" && !settings.wellnessToolsEnabled) return;
    if (target !== "/") navigate(target, { replace: true });
    // Only on mount — later visits to "/" are the user's own navigation.
    // oxlint-disable-next-line react/exhaustive-deps -- run once at app start
  }, []);
  return null;
}

// Longer than any undo window, so a delete still pending in another tab
// isn't purged from under it.
const ARCHIVE_PURGE_AFTER_MS = 60_000;

export function App() {
  useEffect(() => {
    purgeArchivedReminders(Date.now() - ARCHIVE_PURGE_AFTER_MS).catch((err) => {
      console.error("[db] Aufräumen gelöschter Einträge fehlgeschlagen:", err);
    });
  }, []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <MoodLogProvider>
            <NotificationsBootstrap />
            <ToolsBootstrap />
            <Onboarding />
            <LandingRedirect />
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<TodayPage />} />
                {/* New IA destinations */}
                <Route path="mood" element={<MoodPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="you" element={<YouPage />} />
                {/* Legacy routes — kept for back-compat, also reachable */}
                <Route path="habits" element={<HabitsPage />} />
                <Route path="all" element={<AllPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="new" element={<NewReminderPage />} />
                <Route path="edit/:id" element={<EditReminderPage />} />
                <Route path="detail/:id" element={<ReminderDetailPage />} />
                <Route
                  path="tools"
                  element={
                    <Suspense fallback={<ToolsFallback />}>
                      <ToolsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="tools/:toolKey"
                  element={
                    <Suspense fallback={<ToolsFallback />}>
                      <ToolSessionPage />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </MoodLogProvider>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
