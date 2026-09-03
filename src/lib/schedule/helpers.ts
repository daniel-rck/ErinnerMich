import { at } from "../at.ts";
import type { Weekday } from "../types";

const WEEKDAYS: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function parseHM(hhmm: string): { h: number; m: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) throw new Error(`Ungültige Zeit: ${hhmm}`);
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Zeit außerhalb gültiger Bereich: ${hhmm}`);
  }
  return { h, m };
}

export function withTime(base: Date, hhmm: string): Date {
  const { h, m } = parseHM(hhmm);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function weekdayKey(date: Date): Weekday {
  return at(WEEKDAYS, date.getDay());
}

export function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function clampDayInMonth(year: number, monthIndex: number, day: number): number {
  return Math.min(day, lastDayOfMonth(year, monthIndex));
}

/**
 * ISO-8601 week number (Mon-based, week 1 contains the first Thursday).
 */
export function isoWeekNumber(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function weekParity(date: Date): "even" | "odd" {
  return isoWeekNumber(date) % 2 === 0 ? "even" : "odd";
}

export function isAfterOrEqual(a: Date, b: Date): boolean {
  return a.getTime() >= b.getTime();
}
