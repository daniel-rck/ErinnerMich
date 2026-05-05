import { useMemo } from 'react'
import type { Reminder } from '../lib/types'
import { nextOccurrence } from '../lib/schedule/nextOccurrence'
import { formatTime } from '../lib/format'
import { ReminderCard } from './ReminderCard'

interface TodayTimelineProps {
  reminders: Reminder[]
  onEdit?: (reminder: Reminder) => void
  onDelete?: (reminder: Reminder) => void
}

interface TimelineItem {
  reminder: Reminder
  scheduledFor: Date
}

const SECTIONS = [
  { key: 'morning', label: 'Morgen', from: 0, to: 12 },
  { key: 'afternoon', label: 'Mittag', from: 12, to: 17 },
  { key: 'evening', label: 'Abend', from: 17, to: 22 },
  { key: 'night', label: 'Nacht', from: 22, to: 24 },
] as const

export function TodayTimeline({
  reminders,
  onEdit,
  onDelete,
}: TodayTimelineProps) {
  const items = useMemo(() => {
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    const result: TimelineItem[] = []
    for (const reminder of reminders) {
      if (!reminder.active) continue
      const next = nextOccurrence(reminder.schedule, now)
      if (!next) continue
      if (next.getTime() > endOfDay.getTime()) continue
      result.push({ reminder, scheduledFor: next })
    }
    return result.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
  }, [reminders])

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Heute steht nichts an. 🎉
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {SECTIONS.map((section) => {
        const sectionItems = items.filter((item) => {
          const hour = item.scheduledFor.getHours()
          return hour >= section.from && hour < section.to
        })
        if (sectionItems.length === 0) return null
        return (
          <section key={section.key} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-zinc-500 uppercase dark:text-zinc-400">
              {section.label}
            </h2>
            <div className="flex flex-col gap-3">
              {sectionItems.map(({ reminder, scheduledFor }) => (
                <div key={reminder.id} className="flex gap-3">
                  <span className="w-12 shrink-0 pt-4 text-sm font-mono text-zinc-500 dark:text-zinc-400">
                    {formatTime(scheduledFor)}
                  </span>
                  <div className="flex-1">
                    <ReminderCard
                      reminder={reminder}
                      scheduledFor={scheduledFor}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
