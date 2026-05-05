import { NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { KeyboardShortcuts } from './KeyboardShortcuts'

const NAV = [
  { to: '/', label: 'Heute', end: true },
  { to: '/habits', label: 'Habits' },
  { to: '/all', label: 'Alle' },
  { to: '/stats', label: 'Statistik' },
  { to: '/settings', label: 'Einstellungen' },
]

export function AppShell() {
  return (
    <div className="flex min-h-full flex-col">
      <a className="skip-link" href="#main-content">
        Zum Inhalt springen
      </a>
      <KeyboardShortcuts />
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">ErinnerMich</h1>
          <ThemeToggle />
        </div>
      </header>

      <nav
        aria-label="Hauptnavigation"
        className="border-b border-zinc-200 px-6 dark:border-zinc-800"
      >
        <ul className="mx-auto flex max-w-3xl gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  'inline-flex items-center border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ' +
                  (isActive
                    ? 'border-brand-500 text-brand-700 dark:text-brand-300'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8 focus:outline-none"
      >
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>
            ErinnerMich · Daten werden ausschließlich lokal in deinem Browser
            gespeichert.
          </span>
          <span>Keine Cookies · Kein Tracking · DSGVO-konform</span>
        </div>
      </footer>
    </div>
  )
}
