import { legionSize } from './economy';
import type { GameState } from './state';

export interface Quest {
  id: string;
  title: string;
  progress: (s: GameState) => { value: number; goal: number };
}

/** Story quests in order; the first one not done is the active quest. */
export const QUESTS: Quest[] = [
  { id: 'raise_10', title: 'Поднять 10 мертвецов', progress: (s) => ({ value: legionSize(s), goal: 10 }) },
];

export function activeQuest(s: GameState): Quest | null {
  return QUESTS.find((q) => !s.questsDone.includes(q.id)) ?? null;
}

/** Marks the active quest done if its goal is reached; returns it when that happens. */
export function checkQuests(s: GameState): Quest | null {
  const quest = activeQuest(s);
  if (!quest) return null;
  const { value, goal } = quest.progress(s);
  if (value < goal) return null;
  s.questsDone.push(quest.id);
  return quest;
}
