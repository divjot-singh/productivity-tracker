export function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((entry) => removeUndefinedDeep(entry))
      .filter((entry) => entry !== undefined) as T;
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) {
        continue;
      }

      result[key] = removeUndefinedDeep(entry);
    }

    return result as T;
  }

  return value;
}
