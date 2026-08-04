const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const SLEEP_DAY_CUTOFF_MINUTES = 12 * MINUTES_PER_HOUR;

export function parseClockTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * MINUTES_PER_HOUR + minutes;
}

export function normalizeSleepDayMinutes(value: string) {
  const minutes = parseClockTime(value);

  if (minutes === null) {
    return null;
  }

  return minutes < SLEEP_DAY_CUTOFF_MINUTES
    ? minutes + MINUTES_PER_DAY
    : minutes;
}

export function formatClockTime(minutes: number) {
  const normalizedMinutes =
    ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;
  const hours = Math.floor(normalizedMinutes / MINUTES_PER_HOUR);
  const remainingMinutes = normalizedMinutes % MINUTES_PER_HOUR;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

export function formatDurationMinutes(minutes: number) {
  const absoluteMinutes = Math.abs(Math.round(minutes));
  const sign = minutes > 0 ? "+" : minutes < 0 ? "-" : "";
  const hours = Math.floor(absoluteMinutes / MINUTES_PER_HOUR);
  const remainingMinutes = absoluteMinutes % MINUTES_PER_HOUR;

  if (hours === 0) {
    return `${sign}${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${sign}${hours}h`;
  }

  return `${sign}${hours}h ${String(remainingMinutes).padStart(2, "0")}m`;
}
