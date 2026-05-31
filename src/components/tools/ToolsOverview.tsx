import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dayKey } from "../../lib/db/index";
import { useToolEntries } from "../../lib/hooks/useToolEntries";
import { TOOLS, type ToolDef } from "../../lib/tools/registry";

const COLOR_BG: Record<string, string> = {
  sky: "from-sky-100 to-cyan-100 dark:from-sky-950/40 dark:to-cyan-950/40",
  emerald: "from-emerald-100 to-green-100 dark:from-emerald-950/40 dark:to-green-950/40",
  amber: "from-amber-100 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-950/40",
  pink: "from-pink-100 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/40",
  slate: "from-slate-100 to-zinc-100 dark:from-slate-900/60 dark:to-zinc-900/60",
  violet: "from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40",
};

interface ToolsOverviewProps {
  embedded?: boolean;
}

export function ToolsOverview({ embedded = false }: ToolsOverviewProps = {}) {
  return (
    <div className="flex flex-col gap-[var(--space-lg)]">
      {!embedded && (
        <header className="flex flex-col gap-[var(--space-2xs)]">
          <p className="text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
            Wellness
          </p>
          <h1 className="text-[length:var(--text-display)] font-semibold leading-[var(--leading-display)] tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
            Tools
          </h1>
          <p className="text-[length:var(--text-body)] text-[color:var(--color-text-secondary)]">
            Kleine Übungen für zwischendurch — wann immer du sie brauchst.
          </p>
        </header>
      )}

      <section>
        <h2 className="mb-[var(--space-xs)] text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          Akut
        </h2>
        <div className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2">
          {TOOLS.filter((t) => t.category === "acute").map((t) => (
            <ToolCard key={t.key} tool={t} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-[var(--space-xs)] text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-text-tertiary)]">
          Reflexion
        </h2>
        <div className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-2">
          {TOOLS.filter((t) => t.category === "reflection").map((t) => (
            <ToolCard key={t.key} tool={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolDef }) {
  const { entries } = useToolEntries({ toolKey: tool.key });
  const [today] = useState(() => dayKey(Date.now()));
  const todayCount = useMemo(
    () => entries.filter((e) => dayKey(e.loggedAt) === today).length,
    [entries, today],
  );
  const totalCount = entries.length;
  const bg = COLOR_BG[tool.color] ?? COLOR_BG.violet;

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Link
        to={`/tools/${tool.key}`}
        className={`flex items-center gap-3 rounded-[var(--radius-lg)] bg-gradient-to-br p-[var(--space-md)] border border-[color:var(--color-border-subtle)] shadow-[var(--elev-1)] transition-shadow hover:shadow-[var(--elev-2)] ${bg}`}
      >
        <span className="text-3xl" aria-hidden>
          {tool.icon}
        </span>
        <div className="flex-1">
          <h3 className="text-[length:var(--text-body)] font-semibold text-[color:var(--color-text-primary)]">
            {tool.title}
          </h3>
          <p className="mt-0.5 text-[length:var(--text-caption)] text-[color:var(--color-text-secondary)]">
            {tool.blurb}
          </p>
          {totalCount > 0 && (
            <p className="mt-1 text-[length:var(--text-micro)] text-[color:var(--color-text-tertiary)]">
              {todayCount > 0 ? `Heute: ${todayCount} · ` : ""}
              gesamt: {totalCount}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
