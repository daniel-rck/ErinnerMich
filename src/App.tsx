import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { MoodLogProvider } from "./components/MoodLog/MoodLogProvider";
import { Onboarding } from "./components/Onboarding";
import { ConfirmProvider } from "./components/ui/Confirm";
import { ToastProvider } from "./components/ui/Toast";
import { ThemeProvider } from "./lib/hooks/useTheme";
import { NotificationsBootstrap } from "./lib/notifications/NotificationsBootstrap";
import { ToolsBootstrap } from "./lib/tools/ToolsBootstrap";
import { AllPage } from "./pages/All";
import { EditReminderPage } from "./pages/EditReminder";
import { HabitsPage } from "./pages/Habits";
import { LibraryPage } from "./pages/Library";
import { MoodPage } from "./pages/Mood";
import { NewReminderPage } from "./pages/NewReminder";
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
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
      Lade …
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <MoodLogProvider>
              <NotificationsBootstrap />
              <ToolsBootstrap />
              <Onboarding />
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
                </Route>
              </Routes>
            </MoodLogProvider>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
