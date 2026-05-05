import { useNavigate } from 'react-router-dom'
import { AlertTriangle, PackageOpen, CalendarClock } from 'lucide-react'
import { useLowStock } from '../lib/hooks/useInventory'
import { useExpiryRadar } from '../lib/hooks/useExpiryRadar'

export function AttentionStrip() {
  const navigate = useNavigate()
  const { items: lowStock } = useLowStock()
  const { items: allExpiring } = useExpiryRadar()
  const expiring = allExpiring.filter(
    (e) => e.daysRemaining >= 0 && e.daysRemaining <= 30,
  )

  const total = lowStock.length + expiring.length
  if (total === 0) return null

  return (
    <section
      aria-label="Achtung"
      className="flex flex-col gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-700/40 dark:bg-amber-950/20"
    >
      <header className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-900 dark:text-amber-200">
        <AlertTriangle size={14} />
        Achtung
      </header>
      <ul className="flex flex-col gap-1">
        {lowStock.slice(0, 3).map((inv) => (
          <li key={inv.reminderId}>
            <button
              type="button"
              onClick={() => navigate(`/detail/${inv.reminderId}`)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-950/40"
            >
              <PackageOpen size={14} className="shrink-0" />
              <span>
                Vorrat niedrig:{' '}
                <span className="tabular-nums font-medium">
                  {inv.remaining} {inv.unit}
                </span>{' '}
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
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-950/40"
            >
              <CalendarClock size={14} className="shrink-0" />
              <span>
                <span className="font-medium">{item.reminder.title}</span> läuft
                in {item.daysRemaining} Tag{item.daysRemaining === 1 ? '' : 'en'} ab
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
