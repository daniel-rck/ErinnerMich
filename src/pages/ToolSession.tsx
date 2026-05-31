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
  sky: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
  emerald: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
  amber: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
  pink: "from-[color:var(--color-accent-100)] to-[color:var(--color-accent-100)]",
  slate: "from-[color:var(--color-surface-sunken)] to-[color:var(--color-surface)]",
  violet: "from-[color:var(--color-accent-50)] to-[color:var(--color-accent-100)]",
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
        "flex flex-col gap-[1.5rem] relative",
        "-mx-[1rem] -my-[1.5rem] px-[1rem] py-[1.5rem]",
        "md:-mx-[1.5rem] md:-my-[2rem] md:px-[1.5rem] md:py-[2rem]",
        "rounded-[1.25rem]",
        "bg-gradient-to-br",
        gradient,
      ].join(" ")}
    >
      <header className="flex items-center gap-[0.75rem]">
        <IconButton
          icon={ChevronLeft}
          aria-label="Zurück"
          tone="glass"
          shape="circle"
          size="md"
          onClick={() => navigate(-1)}
        />
        <div className="flex flex-1 items-center gap-[0.5rem]">
          <span className="text-3xl" aria-hidden>
            {def.icon}
          </span>
          <h1 className="text-[length:1.625rem] font-semibold leading-[1.25] tracking-[-0.02em] text-[color:var(--color-fg)]">
            {def.title}
          </h1>
        </div>
      </header>
      <Component />
    </div>
  );
}
