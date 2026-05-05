import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './lib/hooks/useTheme'
import { AppShell } from './components/AppShell'
import { TodayPage } from './pages/Today'
import { HabitsPage } from './pages/Habits'
import { AllPage } from './pages/All'
import { SettingsPage } from './pages/Settings'
import { NewReminderPage } from './pages/NewReminder'
import { EditReminderPage } from './pages/EditReminder'
import { NotificationsBootstrap } from './lib/notifications/NotificationsBootstrap'

export function App() {
  return (
    <ThemeProvider>
      <NotificationsBootstrap />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<TodayPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="all" element={<AllPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="new" element={<NewReminderPage />} />
            <Route path="edit/:id" element={<EditReminderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
