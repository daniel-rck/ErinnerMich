export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export type CategoryKey =
  | 'plant'
  | 'health'
  | 'home'
  | 'finance'
  | 'auto'
  | 'social'
  | 'work'
  | 'season'
  | 'expiry'
  | 'inventory'
  | 'mood'
  | 'fitness'
  | 'mind'
  | 'other'

export type ReminderKind = 'reminder' | 'habit' | 'mood'

export type PreWarning =
  | { kind: 'days'; value: number }
  | { kind: 'months'; value: number }
  | { kind: 'years'; value: number }

export type Schedule =
  | {
      type: 'interval'
      minutes: number
      activeWindow?: { start: string; end: string }
    }
  | { type: 'daily'; times: string[] }
  | { type: 'weekly'; days: Weekday[]; time: string }
  | {
      type: 'biweekly'
      days: Weekday[]
      time: string
      weekParity: 'even' | 'odd'
    }
  | { type: 'monthly'; dayOfMonth: number; time: string }
  | {
      type: 'yearly'
      month: number
      day: number
      time: string
      leadDays?: number
    }
  | { type: 'elapsed'; days: number; lastDone?: number }
  | { type: 'expires'; expiresAt: number; preWarnings: PreWarning[] }
  | { type: 'inventory_based' }

export type HabitGoal =
  | { type: 'binary' }
  | { type: 'count'; target: number; unit: string }
  | { type: 'duration'; targetMinutes: number }

export type MoodScale = 'five-emoji' | 'mood-energy-grid'

export type MoodConfig = {
  scale: MoodScale
  promptText?: string
  tags: string[]
}

export type Reminder = {
  id: string
  kind: ReminderKind
  title: string
  description?: string
  category: CategoryKey
  icon: string
  color: string
  schedule: Schedule
  goal?: HabitGoal
  moodConfig?: MoodConfig
  streakSensitive: boolean
  displayAs?: 'countdown'
  active: boolean
  archivedAt?: number
  createdAt: number
  updatedAt: number
}

export type ReminderEventAction =
  | 'completed'
  | 'snoozed'
  | 'skipped'
  | 'missed'
  | 'progress'
  | 'dismissed'

export type ReminderEvent = {
  id: string
  reminderId: string
  scheduledFor?: number
  triggeredAt?: number
  action: ReminderEventAction
  progress?: { value: number; unit: string }
  snoozeUntil?: number
  note?: string
}

export type Inventory = {
  reminderId: string
  remaining: number
  unit: string
  refillThreshold: number
  lastRefillAt?: number
  updatedAt: number
}

export type MoodValue = 1 | 2 | 3 | 4 | 5

export type MoodEntry = {
  id: string
  reminderId?: string
  loggedAt: number
  mood: MoodValue
  energy?: MoodValue
  tags?: string[]
  note?: string
}
