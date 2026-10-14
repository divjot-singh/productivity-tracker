"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeId,
} from "@/lib/themes";

const listeners = new Set<() => void>();

function readTheme(): string {
  const current = document.documentElement.dataset.theme;

  return isThemeId(current) ? current : DEFAULT_THEME;
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}

export function useAppTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);

  const setTheme = useCallback((next: string) => {
    if (!isThemeId(next)) {
      return;
    }

    document.documentElement.dataset.theme = next;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this session.
    }

    listeners.forEach((listener) => listener());
  }, []);

  return { theme, setTheme };
}
