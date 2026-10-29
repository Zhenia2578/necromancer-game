import { LEGION, costOf, maxAffordable, type LegionUnit } from './legion';
import type { GameState } from './state';

export const owned = (s: GameState, id: string) => s.legion[id] ?? 0;

export const legionSize = (s: GameState) => LEGION.reduce((sum, u) => sum + owned(s, u.id), 0);

export function soulsPerSec(s: GameState): number {
  return LEGION.reduce((sum, u) => sum + u.prod * owned(s, u.id), 0);
}

/** Base tap plus a share of passive income, so tapping stays worth it as the Legion grows. */
export function tapValue(s: GameState): number {
  return 1 + soulsPerSec(s) * 0.05;
}

export function addSouls(s: GameState, amount: number): void {
  s.souls += amount;
  s.totalSouls += amount;
}

export function tap(s: GameState): number {
  const gain = tapValue(s);
  addSouls(s, gain);
  s.taps++;
  return gain;
}

export type BuyMode = 1 | 10 | 'max';

/** Units a purchase in this mode would buy; for fixed modes, 0 when unaffordable. */
export function buyCount(s: GameState, unit: LegionUnit, mode: BuyMode): number {
  if (mode === 'max') return maxAffordable(unit, owned(s, unit.id), s.souls);
  return costOf(unit, owned(s, unit.id), mode) <= s.souls ? mode : 0;
}

/** Price shown on the buy button; in max mode with nothing affordable, the price of one. */
export function buyPrice(s: GameState, unit: LegionUnit, mode: BuyMode): number {
  const n = mode === 'max' ? Math.max(1, buyCount(s, unit, mode)) : mode;
  return costOf(unit, owned(s, unit.id), n);
}

export function buy(s: GameState, unit: LegionUnit, mode: BuyMode): number {
  const n = buyCount(s, unit, mode);
  if (n <= 0) return 0;
  s.souls -= costOf(unit, owned(s, unit.id), n);
  s.legion[unit.id] = owned(s, unit.id) + n;
  return n;
}

/** A unit is listed once owned or once the player has earned half its base price. */
export function isRevealed(s: GameState, index: number): boolean {
  const unit = LEGION[index];
  return index === 0 || owned(s, unit.id) > 0 || s.totalSouls >= unit.cost * 0.5;
}
