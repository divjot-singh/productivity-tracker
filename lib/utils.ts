import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatValue(value: number | boolean | string) {
  if (typeof value == "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}
