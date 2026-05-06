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
import { ReminderDetailPage } from './pages/ReminderDetail'
import { NotificationsBootstrap } from './lib/notifications/NotificationsBootstrap'

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <MoodLogProvider>
              <NotificationsBootstrap />
              <Onboarding />
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<TodayPage />} />
                  <Route path="habits" element={<HabitsPage />} />
                  <Route path="all" element={<AllPage />} />
                  <Route path="stats" element={<StatsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="new" element={<NewReminderPage />} />
                  <Route path="edit/:id" element={<EditReminderPage />} />
                  <Route path="detail/:id" element={<ReminderDetailPage />} />
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
