import type {
  CategoryKey,
  HabitGoal,
  ReminderKind,
  Schedule,
} from './types'

export interface Template {
  key: string
  kind: ReminderKind
  title: string
  icon: string
  category: CategoryKey
  color: string
  defaultSchedule: Schedule
  defaultGoal?: HabitGoal
  hasInventory?: boolean
  description?: string
}

export const REMINDER_TEMPLATES: Template[] = [
  {
    key: 'plant',
    kind: 'reminder',
    title: 'Pflanze gießen',
    icon: '🪴',
    category: 'plant',
    color: 'green',
    defaultSchedule: { type: 'elapsed', days: 5 },
  },
  {
    key: 'med',
    kind: 'reminder',
    title: 'Medikament',
    icon: '💊',
    category: 'health',
    color: 'rose',
    defaultSchedule: { type: 'daily', times: ['08:00', '20:00'] },
    hasInventory: true,
  },
  {
    key: 'trash',
    kind: 'reminder',
    title: 'Müll rausbringen',
    icon: '🗑️',
    category: 'home',
    color: 'amber',
    defaultSchedule: { type: 'weekly', days: ['TUE'], time: '19:00' },
  },
  {
    key: 'birthday',
    kind: 'reminder',
    title: 'Geburtstag',
    icon: '🎂',
    category: 'social',
    color: 'pink',
    defaultSchedule: {
      type: 'yearly',
      month: 1,
      day: 1,
      time: '09:00',
      leadDays: 3,
    },
  },
  {
    key: 'rent',
    kind: 'reminder',
    title: 'Miete',
    icon: '🏠',
    category: 'finance',
    color: 'slate',
    defaultSchedule: { type: 'monthly', dayOfMonth: 1, time: '09:00' },
  },
  {
    key: 'car-tuv',
    kind: 'reminder',
    title: 'Auto-TÜV',
    icon: '🚗',
    category: 'auto',
    color: 'blue',
    description: 'Verfällt-Reminder mit Pre-Warnings',
    defaultSchedule: {
      type: 'expires',
      expiresAt: nextYearTimestamp(),
      preWarnings: [
        { kind: 'months', value: 3 },
        { kind: 'months', value: 1 },
        { kind: 'days', value: 7 },
        { kind: 'days', value: 1 },
      ],
    },
  },
  {
    key: 'tires',
    kind: 'reminder',
    title: 'Reifenwechsel',
    icon: '🛞',
    category: 'season',
    color: 'orange',
    defaultSchedule: {
      type: 'yearly',
      month: 4,
      day: 15,
      time: '09:00',
      leadDays: 7,
    },
  },
  {
    key: 'pass',
    kind: 'reminder',
    title: 'Reisepass',
    icon: '🛂',
    category: 'expiry',
    color: 'indigo',
    description: '10 Jahre Gültigkeit, mit Vorlauf',
    defaultSchedule: {
      type: 'expires',
      expiresAt: tenYearsFromNow(),
      preWarnings: [
        { kind: 'years', value: 1 },
        { kind: 'months', value: 6 },
        { kind: 'months', value: 3 },
      ],
    },
  },
  {
    key: 'social-checkin',
    kind: 'reminder',
    title: 'Bei … melden',
    icon: '📞',
    category: 'social',
    color: 'violet',
    defaultSchedule: { type: 'elapsed', days: 21 },
  },
  {
    key: 'inventory-paper',
    kind: 'reminder',
    title: 'Druckerpapier',
    icon: '📄',
    category: 'inventory',
    color: 'stone',
    description: 'Wird durch Bestand getriggert',
    defaultSchedule: { type: 'inventory_based' },
    hasInventory: true,
  },
]

export const HABIT_TEMPLATES: Template[] = [
  {
    key: 'water',
    kind: 'habit',
    title: 'Wasser',
    icon: '💧',
    category: 'health',
    color: 'sky',
    defaultSchedule: { type: 'daily', times: ['09:00'] },
    defaultGoal: { type: 'count', target: 8, unit: 'Glas' },
  },
  {
    key: 'steps',
    kind: 'habit',
    title: 'Schritte',
    icon: '👟',
    category: 'fitness',
    color: 'lime',
    defaultSchedule: { type: 'daily', times: ['20:00'] },
    defaultGoal: { type: 'count', target: 10000, unit: 'Schritte' },
  },
  {
    key: 'read',
    kind: 'habit',
    title: 'Lesen',
    icon: '📖',
    category: 'mind',
    color: 'amber',
    defaultSchedule: { type: 'daily', times: ['21:00'] },
    defaultGoal: { type: 'duration', targetMinutes: 30 },
  },
  {
    key: 'exercise',
    kind: 'habit',
    title: 'Sport',
    icon: '🏋️',
    category: 'fitness',
    color: 'red',
    defaultSchedule: { type: 'daily', times: ['18:00'] },
    defaultGoal: { type: 'duration', targetMinutes: 45 },
  },
  {
    key: 'meditate',
    kind: 'habit',
    title: 'Meditation',
    icon: '🧘',
    category: 'mind',
    color: 'purple',
    defaultSchedule: { type: 'daily', times: ['07:00'] },
    defaultGoal: { type: 'duration', targetMinutes: 10 },
  },
  {
    key: 'journal',
    kind: 'habit',
    title: 'Journaling',
    icon: '📓',
    category: 'mind',
    color: 'teal',
    defaultSchedule: { type: 'daily', times: ['22:00'] },
    defaultGoal: { type: 'binary' },
  },
  {
    key: 'no-sugar',
    kind: 'habit',
    title: 'Kein Zucker',
    icon: '🚫',
    category: 'health',
    color: 'rose',
    defaultSchedule: { type: 'daily', times: ['22:00'] },
    defaultGoal: { type: 'binary' },
  },
  {
    key: 'language',
    kind: 'habit',
    title: 'Sprache lernen',
    icon: '🗣️',
    category: 'mind',
    color: 'blue',
    defaultSchedule: { type: 'daily', times: ['19:00'] },
    defaultGoal: { type: 'duration', targetMinutes: 15 },
  },
  {
    key: 'stretch',
    kind: 'habit',
    title: 'Dehnen',
    icon: '🤸',
    category: 'fitness',
    color: 'emerald',
    defaultSchedule: { type: 'daily', times: ['07:30'] },
    defaultGoal: { type: 'duration', targetMinutes: 10 },
  },
  {
    key: 'sleep',
    kind: 'habit',
    title: 'Schlafenszeit',
    icon: '😴',
    category: 'health',
    color: 'indigo',
    defaultSchedule: { type: 'daily', times: ['22:30'] },
    defaultGoal: { type: 'binary' },
  },
]

export const ALL_TEMPLATES: Template[] = [
  ...REMINDER_TEMPLATES,
  ...HABIT_TEMPLATES,
]

function nextYearTimestamp(): number {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.getTime()
}

function tenYearsFromNow(): number {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 10)
  return d.getTime()
}
