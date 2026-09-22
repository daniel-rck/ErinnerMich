import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <EmptyState
      illustration="calm"
      title="Diese Seite gibt es nicht"
      description="Der Link ist veraltet oder falsch. Zurück zu deinem Tag?"
      primaryAction={{ label: "Zu Heute", onClick: () => navigate("/", { replace: true }) }}
    />
  );
}
