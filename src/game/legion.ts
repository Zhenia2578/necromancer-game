export interface LegionUnit {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  cost: number;
  /** Souls per second per unit. */
  prod: number;
}

/** Act I roster. Numbers come from the prototype's tuned early-game balance. */
export const LEGION: LegionUnit[] = [
  { id: 'skeleton', emoji: '💀', name: 'Скелет', desc: 'Гремит костями и таскает души', cost: 15, prod: 0.1 },
  { id: 'ghoul', emoji: '🧟', name: 'Гуль', desc: 'Жрёт трупы, отрыгивает души', cost: 100, prod: 1 },
  { id: 'mourner', emoji: '🕯️', name: 'Плакальщица', desc: 'Воет над могилами. Души сами приходят посмотреть', cost: 1100, prod: 8 },
  { id: 'plague_corpse', emoji: '🦠', name: 'Чумной труп', desc: 'Ходит медленно, заражает быстро', cost: 12_000, prod: 47 },
  { id: 'grave_worm', emoji: '🪱', name: 'Могильный червь', desc: 'Огромный. Голодный. Твой', cost: 130_000, prod: 260 },
];

export const COST_GROWTH = 1.15;

/** Price of buying `k` more units when `owned` are already owned (geometric series). */
export function costOf(unit: LegionUnit, owned: number, k: number): number {
  const first = unit.cost * COST_GROWTH ** owned;
  return (first * (COST_GROWTH ** k - 1)) / (COST_GROWTH - 1);
}

/** How many units the player can afford right now. */
export function maxAffordable(unit: LegionUnit, owned: number, souls: number): number {
  const first = unit.cost * COST_GROWTH ** owned;
  if (souls < first) return 0;
  return Math.floor(Math.log((souls * (COST_GROWTH - 1)) / first + 1) / Math.log(COST_GROWTH));
}
