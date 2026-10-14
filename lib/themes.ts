export const THEME_STORAGE_KEY = "daylog-theme";

export const DEFAULT_THEME = "indigo";

export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  swatch: { bg: string; surface: string; accent: string };
}

export const THEMES: ThemeOption[] = [
  {
    id: "indigo",
    name: "Graphite Indigo",
    description: "Calm and focused",
    swatch: { bg: "#0d0e12", surface: "#15171c", accent: "#7c83ff" },
  },
  {
    id: "emerald",
    name: "Ink Emerald",
    description: "Fresh and health-forward",
    swatch: { bg: "#0a0f0d", surface: "#111815", accent: "#34d399" },
  },
  {
    id: "rose",
    name: "Noir Rose",
    description: "Warm and personal",
    swatch: { bg: "#0f0c0f", surface: "#171217", accent: "#fb7185" },
  },
  {
    id: "violet",
    name: "Night Violet",
    description: "Rich and playful",
    swatch: { bg: "#100d16", surface: "#18141f", accent: "#a78bfa" },
  },
  {
    id: "graphite",
    name: "Dim Graphite",
    description: "Soft neutral grey",
    swatch: { bg: "#232427", surface: "#2c2d31", accent: "#9aa0ff" },
  },
];

export const THEME_IDS = THEMES.map((theme) => theme.id);

export function isThemeId(value: string | null | undefined): value is string {
  return !!value && THEME_IDS.includes(value);
}
