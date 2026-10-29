interface TelegramWebApp {
  ready(): void;
  expand(): void;
  colorScheme?: 'light' | 'dark';
  initData: string;
}

/** Telegram Mini App handle, or null when the game runs in a regular browser. */
export const tg: TelegramWebApp | null =
  (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp ?? null;

export function initTelegram(): void {
  if (!tg) return;
  tg.ready();
  tg.expand();
}
