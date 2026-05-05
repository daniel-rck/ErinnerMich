import type { Schedule, Weekday } from '../types'

export interface QuickParseResult {
  title: string
  schedule: Schedule
}

interface ParsedTime {
  hour: number
  minute: number
}

const WEEKDAY_MAP: Record<string, Weekday> = {
  montag: 'MON',
  mo: 'MON',
  dienstag: 'TUE',
  di: 'TUE',
  mittwoch: 'WED',
  mi: 'WED',
  donnerstag: 'THU',
  do: 'THU',
  freitag: 'FRI',
  fr: 'FRI',
  samstag: 'SAT',
  sa: 'SAT',
  sonntag: 'SUN',
  so: 'SUN',
}

const WEEKDAY_INDEX: Record<Weekday, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 0,
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}
function timeStr(t: ParsedTime): string {
  return `${pad(t.hour)}:${pad(t.minute)}`
}

function parseTime(input: string): ParsedTime | null {
  const hhmm = input.match(/(?:^|\s)([0-2]?\d):([0-5]\d)(?:$|\s)/)
  if (hhmm) {
    const h = parseInt(hhmm[1], 10)
    const m = parseInt(hhmm[2], 10)
    if (h <= 23) return { hour: h, minute: m }
  }
  const uhr = input.match(/(?:^|\s)(\d{1,2})\s*uhr(?:\s*(\d{1,2}))?/i)
  if (uhr) {
    const h = parseInt(uhr[1], 10)
    const m = uhr[2] ? parseInt(uhr[2], 10) : 0
    if (h <= 23 && m <= 59) return { hour: h, minute: m }
  }
  return null
}

function findWeekday(input: string): { weekday: Weekday; match: string } | null {
  const lower = input.toLowerCase()
  for (const key of Object.keys(WEEKDAY_MAP).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(?:^|\\s)${key}(?:\\s|$)`, 'i')
    if (re.test(lower)) {
      return { weekday: WEEKDAY_MAP[key], match: key }
    }
  }
  return null
}

function relativeKeyword(
  input: string,
): 'today' | 'tomorrow' | 'in-days' | null {
  const lower = input.toLowerCase()
  if (/\bheute\b/.test(lower)) return 'today'
  if (/\bmorgen\b/.test(lower) && !/\b(?:morgens|morgen[s]?\s+um)\b/.test(lower))
    return 'tomorrow'
  if (/\bin\s+\d+\s+tag(?:e|en)?\b/.test(lower)) return 'in-days'
  return null
}

function inDays(input: string): number | null {
  const match = input.toLowerCase().match(/\bin\s+(\d+)\s+tag(?:e|en)?\b/)
  if (!match) return null
  return parseInt(match[1], 10)
}

function stripWeekdayWord(input: string, match: string): string {
  return input
    .replace(new RegExp(`(?:^|\\s)${match}(?=\\s|$)`, 'i'), ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTime(input: string): string {
  return input
    .replace(/(?:^|\s)[0-2]?\d:[0-5]\d(?=\s|$)/g, ' ')
    .replace(/(?:^|\s)\d{1,2}\s*uhr(?:\s*\d{1,2})?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripRelative(input: string): string {
  return input
    .replace(/\b(?:heute|morgen)\b/gi, '')
    .replace(/\bin\s+\d+\s+tag(?:e|en)?\b/gi, '')
    .replace(/\bum\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function quickParse(
  raw: string,
  now: Date = new Date(),
): QuickParseResult | null {
  const input = raw.trim()
  if (input.length === 0) return null

  const time = parseTime(input) ?? { hour: 9, minute: 0 }
  const timeFromInput = parseTime(input) !== null
  const wk = findWeekday(input)
  const rel = relativeKeyword(input)

  let cleaned = input
  cleaned = stripTime(cleaned)
  if (wk) cleaned = stripWeekdayWord(cleaned, wk.match)
  cleaned = stripRelative(cleaned)
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim()

  if (cleaned.length === 0) return null

  const title = cleaned

  if (wk && timeFromInput) {
    return {
      title,
      schedule: { type: 'weekly', days: [wk.weekday], time: timeStr(time) },
    }
  }
  if (wk) {
    return {
      title,
      schedule: { type: 'weekly', days: [wk.weekday], time: timeStr(time) },
    }
  }
  if (rel === 'today') {
    return {
      title,
      schedule: { type: 'daily', times: [timeStr(time)] },
    }
  }
  if (rel === 'tomorrow') {
    const t = new Date(now)
    t.setDate(t.getDate() + 1)
    const day = WEEKDAY_INDEX
    const wkKey = (Object.keys(day) as Weekday[]).find(
      (k) => day[k] === t.getDay(),
    ) as Weekday
    return {
      title,
      schedule: { type: 'weekly', days: [wkKey], time: timeStr(time) },
    }
  }
  if (rel === 'in-days') {
    const n = inDays(input)
    if (n !== null) {
      return { title, schedule: { type: 'elapsed', days: n } }
    }
  }
  if (timeFromInput) {
    return {
      title,
      schedule: { type: 'daily', times: [timeStr(time)] },
    }
  }
  return null
}
