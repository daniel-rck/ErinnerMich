import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  CalendarCheck,
  Flame,
  BarChart3,
  Menu,
  ListTodo,
  Settings as SettingsIcon,
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { Fab } from './Fab'
import { BottomSheet } from './ui/BottomSheet'

const PRIMARY_NAV = [
  { to: '/', label: 'Heute', icon: CalendarCheck, end: true },
  { to: '/habits', label: 'Habits', icon: Flame, end: false },
  { to: '/stats', label: 'Statistik', icon: BarChart3, end: false },
] as const

const SECONDARY_NAV = [
  { to: '/all', label: 'Alle', icon: ListTodo },
  { to: '/settings', label: 'Einstellungen', icon: SettingsIcon },
] as const

export function AppShell() {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className="flex min-h-full flex-col pb-[calc(env(safe-area-inset-bottom)+4rem)] sm:pb-0">
      <a className="skip-link" href="#main-content">
        Zum Inhalt springen
      </a>
      <KeyboardShortcuts />
      <header className="border-b border-zinc-200 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 sm:px-6 sm:py-4 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 no-min-tap"
            aria-label="ErinnerMich"
          >
            <img
              src="/logo.svg"
              alt=""
              aria-hidden
              className="h-7 w-7"
            />
            <span className="text-base font-semibold tracking-tight">
              ErinnerMich
            </span>
          </a>
          <ThemeToggle />
        </div>
      </header>

      <nav
        aria-label="Hauptnavigation"
        className="hidden border-b border-zinc-200 px-6 sm:block dark:border-zinc-800"
      >
        <ul className="mx-auto flex max-w-3xl gap-1 overflow-x-auto">
          {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  'inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ' +
                  (isActive
                    ? 'border-b-2 border-brand-500 text-brand-700 dark:text-brand-300'
                    : 'border-b-2 border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100')
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 focus:outline-none"
      >
        <Outlet />
      </main>

      <nav
        aria-label="Hauptnavigation Mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-white/75 sm:hidden dark:border-zinc-800 dark:bg-zinc-950/90 dark:supports-[backdrop-filter]:bg-zinc-950/75"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {PRIMARY_NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  'flex flex-col items-center gap-0.5 px-2 py-2 text-[11px] font-medium ' +
                  (isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-zinc-500 dark:text-zinc-400')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={
                        'flex h-7 w-12 items-center justify-center rounded-full transition-colors ' +
                        (isActive
                          ? 'bg-brand-100 dark:bg-brand-950/60'
                          : '')
                      }
                    >
                      <item.icon size={18} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex w-full flex-col items-center gap-0.5 px-2 py-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-full">
                <Menu size={18} />
              </span>
              Mehr
            </button>
          </li>
        </ul>
      </nav>

      <Fab />

      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Mehr"
      >
        <ul className="flex flex-col gap-1 pb-4">
          {SECONDARY_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <item.icon size={18} className="text-zinc-500" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  )
}
