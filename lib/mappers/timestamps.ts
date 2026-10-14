// Normalizes the timestamp shapes found in real data: Timestamp, Date, plain {_seconds}/{seconds} objects, ISO strings.
export function toMillis(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) return value.getTime();

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.toMillis === "function") {
      return (record.toMillis as () => number)();
    }

    const seconds = record._seconds ?? record.seconds;
    const nanos = record._nanoseconds ?? record.nanoseconds ?? 0;

    if (typeof seconds === "number") {
      return seconds * 1000 + Math.floor(Number(nanos) / 1_000_000);
    }
  }

  return null;
}

export function toIso(value: unknown): string | undefined {
  const millis = toMillis(value);

  return millis === null ? undefined : new Date(millis).toISOString();
}
