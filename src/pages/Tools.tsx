import { Navigate } from "react-router-dom";
import { ToolsOverview } from "../components/tools/ToolsOverview";
import { useSettings } from "../lib/hooks/useSettings";

interface ToolsPageProps {
  /**
   * When true, omits the outer header — used inside Library tabs.
   */
  embedded?: boolean;
}

export function ToolsPage({ embedded = false }: ToolsPageProps = {}) {
  const { wellnessToolsEnabled } = useSettings();
  if (!wellnessToolsEnabled) return <Navigate to="/" replace />;
  return <ToolsOverview embedded={embedded} />;
}
