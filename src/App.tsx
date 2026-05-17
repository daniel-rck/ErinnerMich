import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './lib/hooks/useTheme'
import { ToastProvider } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/Confirm'
import { MoodLogProvider } from './components/MoodLog/MoodLogProvider'
import { Onboarding } from './components/Onboarding'
import { AppShell } from './components/AppShell'
import { TodayPage } from './pages/Today'
import { HabitsPage } from './pages/Habits'
import { AllPage } from './pages/All'
import { SettingsPage } from './pages/Settings'
import { NewReminderPage } from './pages/NewReminder'
import { EditReminderPage } from './pages/EditReminder'
import { StatsPage } from './pages/Stats'
import { MoodPage } from './pages/Mood'
import { ReminderDetailPage } from './pages/ReminderDetail'
import { NotificationsBootstrap } from './lib/notifications/NotificationsBootstrap'
import { ToolsBootstrap } from './lib/tools/ToolsBootstrap'

const ToolsPage = lazy(() =>
  import('./pages/Tools').then((m) => ({ default: m.ToolsPage })),
)
const ToolSessionPage = lazy(() =>
  import('./pages/ToolSession').then((m) => ({ default: m.ToolSessionPage })),
)

function ToolsFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
      Lade …
    </div>
  )
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
                  {/* New IA destinations — Mood live in PR 4, Library in PR 5, You in PR 6 */}
                  <Route path="mood" element={<MoodPage />} />
                  <Route path="library" element={<HabitsPage />} />
                  <Route path="you" element={<SettingsPage />} />
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
  )
}

export default App
