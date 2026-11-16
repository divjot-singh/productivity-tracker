// Form values can be undefined before the entry loads; Number(undefined) is NaN, which React rejects as an input value.
export function toInputNumber(value: unknown): number | "" {
  if (value === "" || value === undefined || value === null) return "";

  const numeric = Number(value);

  return Number.isNaN(numeric) ? "" : numeric;
}

export function toNumericOrZero(value: unknown): number {
  const numeric = toInputNumber(value);

  return numeric === "" ? 0 : numeric;
}
