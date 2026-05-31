import { HeartPulse, type LucideIcon, Sparkles, Sun, User as UserIcon } from "lucide-react";
import { useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useSettings } from "../lib/hooks/useSettings";
import { CenterFab } from "./CenterFab";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ThemeToggle } from "./ThemeToggle";

interface NavEntry {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const HOME: NavEntry = { to: "/", label: "Heute", icon: Sun, end: true };
const MOOD: NavEntry = { to: "/mood", label: "Stimmung", icon: HeartPulse };
const LIBRARY: NavEntry = { to: "/library", label: "Routinen", icon: Sparkles };
const YOU: NavEntry = { to: "/you", label: "Du", icon: UserIcon };

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 17) return "Hallo";
  if (h < 22) return "Guten Abend";
  return "Gute Nacht";
}

const DATE_FMT = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function AppShell() {
  const now = useMemo(() => new Date(), []);
  const greeting = greetingFor(now);
  const dateLabel = DATE_FMT.format(now);
  const { wellnessToolsEnabled } = useSettings();
  const nav: NavEntry[] = wellnessToolsEnabled ? [HOME, MOOD, LIBRARY, YOU] : [HOME, LIBRARY, YOU];

  return (
    <div
      className={[
        "flex min-h-full flex-col",
        "pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-0",
        "md:pl-[var(--side-nav-w,15rem)]",
      ].join(" ")}
    >
      <a className="skip-link" href="#main-content">
        Zum Inhalt springen
      </a>
      <KeyboardShortcuts />

      {/* Mobile top bar (glass) */}
      <header
        className={[
          "md:hidden",
          "sticky top-0 z-30",
          "surface-glass",
          "px-[var(--space-md)] pt-[calc(env(safe-area-inset-top)+var(--space-sm))] pb-[var(--space-sm)]",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-3xl items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
              {dateLabel}
            </div>
            <h1 className="truncate text-[length:var(--text-title-1)] font-semibold tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
              {greeting}
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop side-nav */}
      <aside
        aria-label="Hauptnavigation"
        className={[
          "hidden md:flex md:flex-col",
          "fixed left-0 top-0 bottom-0 z-40 w-60",
          "border-r border-[color:var(--color-border-subtle)]",
          "bg-[color:var(--color-surface-elevated)]",
          "p-[var(--space-md)]",
        ].join(" ")}
      >
        <NavLink
          to="/"
          end
          className="inline-flex items-center gap-2 px-2 py-2 no-min-tap"
          aria-label="ErinnerMich"
        >
          <img src="/logo.svg" alt="" aria-hidden className="h-7 w-7" />
          <span className="text-[length:var(--text-title-2)] font-semibold tracking-[var(--tracking-tight)]">
            ErinnerMich
          </span>
        </NavLink>

        <div className="mt-[var(--space-md)]">
          <CenterFab variant="pill" />
        </div>

        <ul className="mt-[var(--space-md)] flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <li key={item.to}>
              <DesktopNavLink item={item} />
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[color:var(--color-border-subtle)] pt-[var(--space-sm)]">
          <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-tertiary)]">
            Lokal &amp; privat
          </span>
          <ThemeToggle />
        </div>
      </aside>

      <main
        id="main-content"
        tabIndex={-1}
        className={[
          "mx-auto flex w-full max-w-3xl flex-1 flex-col",
          "px-[var(--space-md)] py-[var(--space-lg)] md:px-[var(--space-lg)] md:py-[var(--space-xl)]",
          "focus:outline-none",
        ].join(" ")}
      >
        <Outlet />
      </main>

      {/* Mobile bottom nav with center FAB */}
      <nav
        aria-label="Hauptnavigation Mobile"
        className={[
          "md:hidden",
          "fixed inset-x-0 bottom-0 z-30",
          "pb-[env(safe-area-inset-bottom)]",
          "surface-glass-strong",
          "border-t border-[color:var(--color-border-subtle)]",
        ].join(" ")}
      >
        <ul className="mx-auto flex max-w-md items-center justify-around px-2">
          {(() => {
            // Split the nav around the centered FAB. With 4 items the split is
            // 2 | FAB | 2; with 3 items it's 1 | FAB | 2.
            const split = Math.ceil(nav.length / 2);
            const left = nav.slice(0, split);
            const right = nav.slice(split);
            return (
              <>
                {left.map((item) => (
                  <li key={item.to} className="flex-1">
                    <MobileNavLink item={item} />
                  </li>
                ))}
                <li className="flex shrink-0 items-start justify-center px-1 pt-2">
                  <CenterFab variant="circle" />
                </li>
                {right.map((item) => (
                  <li key={item.to} className="flex-1">
                    <MobileNavLink item={item} />
                  </li>
                ))}
              </>
            );
          })()}
        </ul>
      </nav>
    </div>
  );
}

function MobileNavLink({ item }: { item: NavEntry }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          "flex h-full w-full flex-col items-center justify-center gap-0.5",
          "py-2.5 min-h-[var(--tap-target)]",
          "text-[length:var(--text-micro)] font-medium",
          "transition-colors duration-[var(--motion-fast)]",
          isActive
            ? "text-[color:var(--color-brand-600)]"
            : "text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-secondary)]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "flex h-7 w-12 items-center justify-center rounded-full",
              "transition-colors",
              isActive ? "bg-[color:var(--color-brand-50)]" : "",
            ].join(" ")}
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
          </span>
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function DesktopNavLink({ item }: { item: NavEntry }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)]",
          "text-[length:var(--text-body)] font-medium",
          "transition-[background-color,color] duration-[var(--motion-fast)]",
          isActive
            ? "bg-[color:var(--color-brand-50)] text-[color:var(--color-brand-700)]"
            : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-sunken)] hover:text-[color:var(--color-text-primary)]",
        ].join(" ")
      }
    >
      <Icon size={18} aria-hidden />
      {item.label}
    </NavLink>
  );
}
