import {
  type ButtonHTMLAttributes,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useRef,
} from "react";

interface TabsContextValue {
  value: string;
  onChange: (v: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs subcomponents must be inside <Tabs>");
  return ctx;
}

export interface TabsRootProps {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onChange, children, className = "" }: TabsRootProps) {
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ value, onChange, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

function TabsList({ children, ariaLabel, className = "" }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center gap-1 p-1",
        "bg-[color:var(--color-surface-sunken)]",
        "rounded-[var(--radius-md)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: ReactNode;
}

function TabsTrigger({ value, children, className = "", onClick, ...rest }: TabsTriggerProps) {
  const ctx = useTabs();
  const ref = useRef<HTMLButtonElement>(null);
  const active = ctx.value === value;
  const tabId = `${ctx.baseId}-tab-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const list = ref.current?.parentElement;
    if (!list) return;
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const idx = tabs.indexOf(ref.current!);
    const next =
      e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
    e.preventDefault();
  };

  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      id={tabId}
      aria-controls={panelId}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        ctx.onChange(value);
        onClick?.(e);
      }}
      className={[
        "inline-flex items-center justify-center px-3 py-1.5",
        "rounded-[var(--radius-sm)]",
        "text-[length:var(--text-caption)] font-medium",
        "transition-[background-color,color] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
        active
          ? "bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-primary)] shadow-[var(--elev-1)]"
          : "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface TabsPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabsPanel({ value, children, className = "" }: TabsPanelProps) {
  const ctx = useTabs();
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      className={className}
    >
      {children}
    </div>
  );
}

// Compound-component API. TypeScript widens the function's type to include
// these properties via inference, so `Tabs.List` etc. are type-safe.
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Panel = TabsPanel;
