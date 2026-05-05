import type { Reminder } from '../types'

export type NotificationActionId =
  | 'done'
  | 'snooze-10'
  | 'snooze-30'
  | 'snooze-60'
  | 'skip'
  | '+1'
  | 'mood-1'
  | 'mood-2'
  | 'mood-3'
  | 'mood-4'
  | 'mood-5'

export interface NotificationActionDef {
  action: NotificationActionId
  title: string
}

export interface NotificationDescriptor {
  tag: string
  title: string
  body?: string
  icon?: string
  actions: NotificationActionDef[]
  /** Stored on the notification's `data` so the SW can reconstruct context. */
  data: NotificationData
}

export interface NotificationData {
  reminderId: string
  kind: Reminder['kind']
  scheduledFor: number
}

const REMINDER_ACTIONS: NotificationActionDef[] = [
  { action: 'done', title: 'Erledigt' },
  { action: 'snooze-30', title: '+30 min' },
  { action: 'skip', title: 'Skip' },
]

const HABIT_ACTIONS: NotificationActionDef[] = [
  { action: '+1', title: '+1' },
  { action: 'done', title: 'Erledigt' },
  { action: 'snooze-30', title: '+30 min' },
]

// Spec wants 5 emojis as actions. Most browsers cap visible actions at 2-3,
// but we publish all five — the OS picks what to render in the long-press menu.
const MOOD_ACTIONS: NotificationActionDef[] = [
  { action: 'mood-1', title: '😢' },
  { action: 'mood-2', title: '😕' },
  { action: 'mood-3', title: '😐' },
  { action: 'mood-4', title: '🙂' },
  { action: 'mood-5', title: '😄' },
]

export function actionsForKind(kind: Reminder['kind']): NotificationActionDef[] {
  switch (kind) {
    case 'habit':
      return HABIT_ACTIONS
    case 'mood':
      return MOOD_ACTIONS
    default:
      return REMINDER_ACTIONS
  }
}

export function notificationTag(reminderId: string, scheduledFor: number): string {
  return `reminder-${reminderId}-${scheduledFor}`
}

export function buildDescriptor(
  reminder: Reminder,
  scheduledFor: Date,
): NotificationDescriptor {
  const ts = scheduledFor.getTime()
  return {
    tag: notificationTag(reminder.id, ts),
    title: `${reminder.icon} ${reminder.title}`,
    body: bodyFor(reminder),
    actions: actionsForKind(reminder.kind),
    data: {
      reminderId: reminder.id,
      kind: reminder.kind,
      scheduledFor: ts,
    },
  }
}

function bodyFor(reminder: Reminder): string | undefined {
  if (reminder.kind === 'mood') {
    return reminder.moodConfig?.promptText ?? 'Wie geht es dir gerade?'
  }
  return reminder.description
}
