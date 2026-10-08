import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { MoodLogProvider } from "./components/MoodLog/MoodLogProvider";
import { Onboarding } from "./components/Onboarding";
import { ConfirmProvider } from "./components/ui/Confirm";
import { ToastProvider } from "./components/ui/Toast";
import { purgeArchivedReminders } from "./lib/db/reminders";
import { readSettings } from "./lib/db/settings";
import { NotificationsBootstrap } from "./lib/notifications/NotificationsBootstrap";
import { ROUTES } from "./lib/routes.ts";
import { ToolsBootstrap } from "./lib/tools/ToolsBootstrap";

const LANDING_PATH = {
  today: ROUTES.home,
  habits: ROUTES.library,
  mood: ROUTES.mood,
} as const;

/**
 * Applies the "Standard-Startseite" setting once per app start: a plain launch
 * on "/" (no deep link, no query like `?notif=`) goes to the chosen tab.
 */
function LandingRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname !== ROUTES.home || location.search !== "") return;
    const settings = readSettings();
    const target = LANDING_PATH[settings.defaultLandingTab];
    if (target === ROUTES.mood && !settings.wellnessToolsEnabled) return;
    if (target !== ROUTES.home) void navigate(target, { replace: true });
    // Only on mount — later visits to "/" are the user's own navigation.
    // oxlint-disable-next-line react/exhaustive-deps -- run once at app start
  }, []);
  return null;
}

// Longer than any undo window, so a delete still pending in another tab
// isn't purged from under it.
const ARCHIVE_PURGE_AFTER_MS = 60_000;

/**
 * The root layout route (src/lib/router.tsx): app-wide providers, the
 * notification/tool bootstraps and ErinnerMich's own shell, which renders the
 * page through its <Outlet />.
 */
export function App() {
  useEffect(() => {
    purgeArchivedReminders(Date.now() - ARCHIVE_PURGE_AFTER_MS).catch((err) => {
      console.error("[db] Aufräumen gelöschter Einträge fehlgeschlagen:", err);
    });
  }, []);

  // `reducedMotion="user"`: framer-motion's JS springs ignore the CSS
  // prefers-reduced-motion rule in tokens.css; this turns transform/layout
  // animations off for those users app-wide (opacity fades stay).
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <ConfirmProvider>
          <MoodLogProvider>
            <NotificationsBootstrap />
            <ToolsBootstrap />
            <Onboarding />
            <LandingRedirect />
            <AppShell />
          </MoodLogProvider>
        </ConfirmProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
