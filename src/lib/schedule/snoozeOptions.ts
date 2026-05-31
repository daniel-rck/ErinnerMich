export interface SnoozeOption {
  key: string;
  label: string;
  at: Date;
}

const HALF_HOUR_MS = 30 * 60_000;
const ONE_HOUR_MS = 60 * 60_000;

function setTime(base: Date, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function nextWeekday(now: Date, targetDay: number): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const cur = d.getDay();
  let delta = (targetDay - cur + 7) % 7;
  if (delta === 0) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

/**
 * Standard snooze offerings ordered from soonest to furthest.
 * "Heute Abend" is filtered out if it lies in the past or within 30 min.
 */
export function snoozeOptions(now: Date = new Date()): SnoozeOption[] {
  const out: SnoozeOption[] = [];

  out.push({
    key: "15min",
    label: "In 15 min",
    at: new Date(now.getTime() + HALF_HOUR_MS / 2),
  });
  out.push({
    key: "1h",
    label: "In 1 Stunde",
    at: new Date(now.getTime() + ONE_HOUR_MS),
  });

  const tonight = setTime(now, 18, 0);
  if (tonight.getTime() - now.getTime() > HALF_HOUR_MS) {
    out.push({
      key: "tonight",
      label: "Heute Abend (18:00)",
      at: tonight,
    });
  }

  const tomorrowMorning = setTime(now, 8, 0);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  out.push({
    key: "tomorrow-morning",
    label: "Morgen früh (08:00)",
    at: tomorrowMorning,
  });

  const tomorrowEvening = setTime(now, 18, 0);
  tomorrowEvening.setDate(tomorrowEvening.getDate() + 1);
  out.push({
    key: "tomorrow-evening",
    label: "Morgen Abend (18:00)",
    at: tomorrowEvening,
  });

  const nextMonday = setTime(nextWeekday(now, 1), 9, 0);
  out.push({
    key: "next-week",
    label: "Nächste Woche (Mo 09:00)",
    at: nextMonday,
  });

  return out;
}
