import { Monitor, Moon, Sun } from "lucide-react";
import { type Theme, useTheme } from "../lib/ui/useTheme";
import { IconButton } from "./ui/IconButton";

const ORDER: Theme[] = ["system", "light", "dark"];
const META: Record<Theme, { icon: typeof Sun; label: string; aria: string }> = {
  system: {
    icon: Monitor,
    label: "System",
    aria: "Modus: System (Auf hellen Modus wechseln)",
  },
  light: {
    icon: Sun,
    label: "Hell",
    aria: "Modus: Hell (Auf dunklen Modus wechseln)",
  },
  dark: {
    icon: Moon,
    label: "Dunkel",
    aria: "Modus: Dunkel (Auf System-Modus wechseln)",
  },
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = META[theme];

  function cycle() {
    const idx = ORDER.indexOf(theme);
    setTheme(ORDER[(idx + 1) % ORDER.length]);
  }

  return (
    <IconButton
      icon={current.icon}
      onClick={cycle}
      aria-label={current.aria}
      title={current.aria}
      tone="neutral"
      size="md"
      shape="circle"
    />
  );
}
