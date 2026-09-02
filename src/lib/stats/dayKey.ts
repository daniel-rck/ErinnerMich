export function dayKeyForDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Parse a "YYYY-MM-DD" key. Keys are produced by `dayKeyForDate`, so the shape
 *  holds — but a malformed one must not silently become an Invalid Date. */
function parseDayKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(y)) {
    throw new RangeError(`Malformed day key: ${key}`);
  }
  return { y, m, d };
}

export function dayKeyAddDays(key: string, delta: number): string {
  const { y, m, d } = parseDayKey(key);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return dayKeyForDate(date);
}

export function diffDays(a: string, b: string): number {
  const first = parseDayKey(a);
  const second = parseDayKey(b);
  const da = new Date(first.y, first.m - 1, first.d).getTime();
  const db = new Date(second.y, second.m - 1, second.d).getTime();
  return Math.round((da - db) / (24 * 60 * 60 * 1000));
}

export function lastNDayKeys(n: number, today: Date = new Date()): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(dayKeyForDate(d));
  }
  return result;
}
