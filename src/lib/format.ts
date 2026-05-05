import type { Schedule, Weekday } from './types'

const WEEKDAY_LABELS: Record<Weekday, string> = {
  MON: 'Mo',
  TUE: 'Di',
  WED: 'Mi',
  THU: 'Do',
  FRI: 'Fr',
  SAT: 'Sa',
  SUN: 'So',
}

export function formatSchedule(schedule: Schedule): string {
  switch (schedule.type) {
    case 'interval': {
      const window = schedule.activeWindow
        ? ` (${schedule.activeWindow.start}–${schedule.activeWindow.end})`
        : ''
      return `Alle ${schedule.minutes} min${window}`
    }
    case 'daily':
      return `Täglich um ${[...schedule.times].sort().join(' / ')}`
    case 'weekly':
      return `${schedule.days.map((d) => WEEKDAY_LABELS[d]).join(' / ')} um ${schedule.time}`
    case 'biweekly':
      return `${schedule.days.map((d) => WEEKDAY_LABELS[d]).join(' / ')} (${schedule.weekParity === 'even' ? 'gerade' : 'ungerade'} KW) um ${schedule.time}`
    case 'monthly':
      return `Am ${schedule.dayOfMonth}. jeden Monats um ${schedule.time}`
    case 'yearly': {
      const lead = schedule.leadDays
        ? ` (${schedule.leadDays} Tage Vorlauf)`
        : ''
      return `Jährlich am ${schedule.day}.${schedule.month}. um ${schedule.time}${lead}`
    }
    case 'elapsed':
      return `Alle ${schedule.days} Tage`
    case 'expires': {
      const date = new Date(schedule.expiresAt)
      return `Verfällt am ${date.toLocaleDateString('de-DE')}`
    }
    case 'inventory_based':
      return 'Wenn Bestand niedrig'
  }
}

export function formatRelativeDate(target: Date, now = new Date()): string {
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return 'heute'
  if (diffDays === 1) return 'morgen'
  if (diffDays === -1) return 'gestern'
  if (diffDays > 0) return `in ${diffDays} Tagen`
  return `vor ${Math.abs(diffDays)} Tagen`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
