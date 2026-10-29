export interface StoryCheckpoint {
  /** Serialized ink state captured before the step currently on screen. */
  ink: string;
  scene: string | null;
}

export interface GameState {
  version: 1;
  souls: number;
  /** Souls earned over the whole run; drives unit reveals. */
  totalSouls: number;
  taps: number;
  legion: Record<string, number>;
  heroName: string;
  skullName: string;
  prologueDone: boolean;
  /** In-progress prologue, so a reload resumes the dialogue where it was. */
  prologue: StoryCheckpoint | null;
  endings: string[];
  questsDone: string[];
  savedAt: number;
}

export function freshState(): GameState {
  return {
    version: 1,
    souls: 0,
    totalSouls: 0,
    taps: 0,
    legion: {},
    heroName: '',
    skullName: '',
    prologueDone: false,
    prologue: null,
    endings: [],
    questsDone: [],
    savedAt: Date.now(),
  };
}
