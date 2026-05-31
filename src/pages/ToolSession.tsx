import { ChevronLeft } from "lucide-react";
import type { ReactElement } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Affirmation } from "../components/tools/Affirmation";
import { BreathingBubble } from "../components/tools/BreathingBubble";
import { GratitudeJar } from "../components/tools/GratitudeJar";
import { Grounding } from "../components/tools/Grounding";
import { TreasureBox } from "../components/tools/TreasureBox";
import { WorryBox } from "../components/tools/WorryBox";
import { IconButton } from "../components/ui/IconButton";
import { useSettings } from "../lib/hooks/useSettings";
import { TOOL_BY_KEY } from "../lib/tools/registry";
import type { ToolKey } from "../lib/types";

const COMPONENTS: Record<ToolKey, () => ReactElement> = {
  breathing: BreathingBubble,
  grounding: Grounding,
  gratitude: GratitudeJar,
  treasure: TreasureBox,
  worry: WorryBox,
  affirmation: Affirmation,
};

const TOOL_GRADIENT: Record<string, string> = {
  sky: "from-[color:var(--color-accent-calm-soft)] to-[color:var(--color-accent-grow-soft)]",
  emerald: "from-[color:var(--color-accent-grow-soft)] to-[color:var(--color-accent-calm-soft)]",
  amber: "from-[color:var(--color-accent-glow-soft)] to-[color:var(--color-accent-mood-soft)]",
  pink: "from-[color:var(--color-accent-mood-soft)] to-[color:var(--color-accent-glow-soft)]",
  slate: "from-[color:var(--color-surface-sunken)] to-[color:var(--color-surface-elevated)]",
  violet: "from-[color:var(--color-brand-50)] to-[color:var(--color-accent-mood-soft)]",
};

export function ToolSessionPage() {
  const { wellnessToolsEnabled } = useSettings();
  const { toolKey } = useParams<{ toolKey: string }>();
  const navigate = useNavigate();

  if (!wellnessToolsEnabled) return <Navigate to="/" replace />;

  const def = toolKey ? TOOL_BY_KEY[toolKey as ToolKey] : undefined;
  if (!def) return <Navigate to="/mood" replace />;

  const Component = COMPONENTS[def.key];
  const gradient = TOOL_GRADIENT[def.color] ?? TOOL_GRADIENT.violet;

  return (
    <div
      className={[
        "flex flex-col gap-[var(--space-lg)] relative",
        "-mx-[var(--space-md)] -my-[var(--space-lg)] px-[var(--space-md)] py-[var(--space-lg)]",
        "md:-mx-[var(--space-lg)] md:-my-[var(--space-xl)] md:px-[var(--space-lg)] md:py-[var(--space-xl)]",
        "rounded-[var(--radius-lg)]",
        "bg-gradient-to-br",
        gradient,
      ].join(" ")}
    >
      <header className="flex items-center gap-[var(--space-sm)]">
        <IconButton
          icon={ChevronLeft}
          aria-label="Zurück"
          tone="glass"
          shape="circle"
          size="md"
          onClick={() => navigate(-1)}
        />
        <div className="flex flex-1 items-center gap-[var(--space-xs)]">
          <span className="text-3xl" aria-hidden>
            {def.icon}
          </span>
          <h1 className="text-[length:var(--text-title-1)] font-semibold leading-[var(--leading-title)] tracking-[var(--tracking-tight)] text-[color:var(--color-text-primary)]">
            {def.title}
          </h1>
        </div>
      </header>
      <Component />
    </div>
  );
}
