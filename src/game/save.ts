import { freshState, type GameState } from './state';

const SAVE_KEY = 'necromancer_save_v2';

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<GameState>;
    // Merge onto defaults so saves from older builds pick up new fields.
    return { ...freshState(), ...parsed, legion: { ...parsed.legion } };
  } catch (error) {
    console.warn('Save is unreadable, starting fresh.', error);
    return freshState();
  }
}

export function saveGame(s: GameState): void {
  s.savedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch (error) {
    console.warn('Saving failed.', error);
  }
}

export function resetGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
}
