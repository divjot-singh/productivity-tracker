// Local-calendar dates (YYYY-MM-DD); toISOString() would give the UTC day and mislabel entries near midnight.
export function localDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function localYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  return localDate(date);
}
