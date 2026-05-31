import { AlertTriangle, CalendarClock, PackageOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useExpiryRadar } from "../lib/hooks/useExpiryRadar";
import { useLowStock } from "../lib/hooks/useInventory";
import { Card } from "./ui/Card";

export function AttentionStrip() {
  const navigate = useNavigate();
  const { items: lowStock } = useLowStock();
  const { items: allExpiring } = useExpiryRadar();
  const expiring = allExpiring.filter((e) => e.daysRemaining >= 0 && e.daysRemaining <= 30);

  const total = lowStock.length + expiring.length;
  if (total === 0) return null;

  return (
    <Card
      variant="raised"
      radius="lg"
      padding="md"
      aria-label="Achtung"
      as="section"
      className="bg-[color:var(--color-warning-soft)] border-[color:var(--color-warning)]/30"
    >
      <header className="mb-[var(--space-xs)] flex items-center gap-2 text-[length:var(--text-micro)] tracking-[var(--tracking-caps)] uppercase font-medium text-[color:var(--color-warning)]">
        <AlertTriangle size={14} aria-hidden />
        Achtung
      </header>
      <ul className="flex flex-col gap-0.5">
        {lowStock.slice(0, 3).map((inv) => (
          <li key={inv.reminderId}>
            <button
              type="button"
              onClick={() => navigate(`/detail/${inv.reminderId}`)}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[length:var(--text-body)] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-elevated)]"
            >
              <PackageOpen
                size={14}
                aria-hidden
                className="shrink-0 text-[color:var(--color-warning)]"
              />
              <span>
                Vorrat niedrig:{" "}
                <span className="tabular-nums font-medium">
                  {inv.remaining} {inv.unit}
                </span>{" "}
                (Schwelle {inv.refillThreshold})
              </span>
            </button>
          </li>
        ))}
        {expiring.slice(0, 3).map((item) => (
          <li key={item.reminder.id}>
            <button
              type="button"
              onClick={() => navigate(`/detail/${item.reminder.id}`)}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[length:var(--text-body)] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-elevated)]"
            >
              <CalendarClock
                size={14}
                aria-hidden
                className="shrink-0 text-[color:var(--color-warning)]"
              />
              <span>
                <span className="font-medium">{item.reminder.title}</span> läuft in{" "}
                {item.daysRemaining} Tag{item.daysRemaining === 1 ? "" : "en"} ab
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
