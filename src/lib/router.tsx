import { lazy, Suspense } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { App } from "../App.tsx";
import { AppRouteError } from "../components/AppRouteError.tsx";
import { AllPage } from "../pages/All.tsx";
import { EditReminderPage } from "../pages/EditReminder.tsx";
import { HabitsPage } from "../pages/Habits.tsx";
import { LibraryPage } from "../pages/Library.tsx";
import { MoodPage } from "../pages/Mood.tsx";
import { NewReminderPage } from "../pages/NewReminder.tsx";
import { ReminderDetailPage } from "../pages/ReminderDetail.tsx";
import { SettingsPage } from "../pages/Settings.tsx";
import { StatsPage } from "../pages/Stats.tsx";
import { TodayPage } from "../pages/Today.tsx";
import { YouPage } from "../pages/You.tsx";
import { ROUTES } from "./routes.ts";
import { NotFound } from "./routing/NotFound.tsx";
import { RouteFallback } from "./routing/RouteFallback.tsx";

// The wellness tools stay a lazy chunk behind a Suspense boundary inside the
// shell — React.lazy rather than a route `lazy`, so the shell keeps showing
// „Lade …" during the load instead of holding the previous page.
const ToolsPage = lazy(() => import("../pages/Tools.tsx").then((m) => ({ default: m.ToolsPage })));
const ToolSessionPage = lazy(() =>
  import("../pages/ToolSession.tsx").then((m) => ({ default: m.ToolSessionPage })),
);

function ToolsFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-fg-muted">
      Lade …
    </div>
  );
}

/** Child paths are relative to the root route ("/"). */
const rel = (path: string) => path.replace(/^\//, "");

export const routes: RouteObject[] = [
  {
    // The root layout route: providers, bootstraps and the app shell around
    // every page (src/App.tsx).
    path: ROUTES.home,
    Component: App,
    ErrorBoundary: AppRouteError,
    HydrateFallback: RouteFallback,
    children: [
      {
        // A page error renders inside the shell, so the navigation keeps working.
        ErrorBoundary: AppRouteError,
        children: [
          { index: true, Component: TodayPage },
          { path: rel(ROUTES.mood), Component: MoodPage },
          { path: rel(ROUTES.library), Component: LibraryPage },
          { path: rel(ROUTES.you), Component: YouPage },
          { path: rel(ROUTES.habits), Component: HabitsPage },
          { path: rel(ROUTES.all), Component: AllPage },
          { path: rel(ROUTES.stats), Component: StatsPage },
          { path: rel(ROUTES.settings), Component: SettingsPage },
          { path: rel(ROUTES.newReminder), Component: NewReminderPage },
          { path: rel(ROUTES.editReminder), Component: EditReminderPage },
          { path: rel(ROUTES.reminderDetail), Component: ReminderDetailPage },
          {
            path: rel(ROUTES.tools),
            element: (
              <Suspense fallback={<ToolsFallback />}>
                <ToolsPage />
              </Suspense>
            ),
          },
          {
            path: rel(ROUTES.toolSession),
            element: (
              <Suspense fallback={<ToolsFallback />}>
                <ToolSessionPage />
              </Suspense>
            ),
          },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
];

/** One router per page load (main.tsx); tests build their own from `routes`. */
export function createAppRouter() {
  return createBrowserRouter(routes);
}
