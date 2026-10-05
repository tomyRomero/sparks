export const THEME_COOKIE = "sparks_theme";
export const SIDEBAR_COOKIE = "sparks_sidebar";

export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];

export function toTheme(value: string | undefined): Theme {
  return themes.find((theme) => theme === value) ?? "system";
}

/** Kept in a cookie for a year, so the server renders the first paint the right way. */
export function savePreference(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}
