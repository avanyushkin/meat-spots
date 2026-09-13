import { useEffect } from "react";
import { getThemeParams, onThemeChanged } from "../lib/telegram";

const VAR_MAP: Record<string, string> = {
  bg_color: "--tg-bg",
  text_color: "--tg-text",
  hint_color: "--tg-hint",
  link_color: "--tg-link",
  button_color: "--tg-button",
  button_text_color: "--tg-button-text",
  secondary_bg_color: "--tg-secondary-bg",
};

function applyTheme() {
  const params = getThemeParams();
  const root = document.documentElement.style;
  for (const [key, cssVar] of Object.entries(VAR_MAP)) {
    const value = params[key as keyof typeof params];
    if (value) root.setProperty(cssVar, value);
  }
}

export function useTelegramTheme(): void {
  useEffect(() => {
    applyTheme();
    return onThemeChanged(applyTheme);
  }, []);
}
