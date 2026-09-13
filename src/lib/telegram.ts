interface TelegramCloudStorage {
  setItem(key: string, value: string, callback?: (error: unknown, success: boolean) => void): void;
  getItem(key: string, callback: (error: unknown, value: string) => void): void;
  removeItem(key: string, callback?: (error: unknown, success: boolean) => void): void;
}

interface TelegramBackButton {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;
  onEvent(event: "themeChanged", cb: () => void): void;
  offEvent(event: "themeChanged", cb: () => void): void;
  CloudStorage: TelegramCloudStorage;
  BackButton: TelegramBackButton;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function isInTelegram(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
}

export function initTelegram(): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  webApp.ready();
  webApp.expand();
}

export function getThemeParams(): TelegramThemeParams {
  return window.Telegram?.WebApp.themeParams ?? {};
}

export function onThemeChanged(cb: () => void): () => void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return () => {};
  webApp.onEvent("themeChanged", cb);
  return () => webApp.offEvent("themeChanged", cb);
}

export function useBackButton(onBack: () => void): () => void {
  const backButton = window.Telegram?.WebApp.BackButton;
  if (!backButton) return () => {};
  backButton.show();
  backButton.onClick(onBack);
  return () => {
    backButton.offClick(onBack);
    backButton.hide();
  };
}

// В самом Telegram-клиенте используем CloudStorage (синхронизируется между
// устройствами одного аккаунта), вне Telegram (обычный браузер, для
// разработки/тестирования) — откатываемся на localStorage.
export function storageGet(key: string): Promise<string | null> {
  const cloud = window.Telegram?.WebApp.CloudStorage;
  if (!cloud) return Promise.resolve(localStorage.getItem(key));
  return new Promise((resolve) => {
    cloud.getItem(key, (error, value) => {
      if (error || !value) resolve(null);
      else resolve(value);
    });
  });
}

export function storageSet(key: string, value: string): Promise<void> {
  const cloud = window.Telegram?.WebApp.CloudStorage;
  if (!cloud) {
    localStorage.setItem(key, value);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    cloud.setItem(key, value, () => resolve());
  });
}

export function storageRemove(key: string): Promise<void> {
  const cloud = window.Telegram?.WebApp.CloudStorage;
  if (!cloud) {
    localStorage.removeItem(key);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    cloud.removeItem(key, () => resolve());
  });
}
