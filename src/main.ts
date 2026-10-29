import prologue from '../story/prologue.ink';
import { createStage } from './fx/stage';
import { addSouls, soulsPerSec } from './game/economy';
import { loadGame, saveGame } from './game/save';
import type { GameState } from './game/state';
import { ENDINGS } from './story/endings';
import { StoryRunner } from './story/runner';
import { initTelegram } from './telegram';
import { playStory } from './ui/dialogue';
import { el } from './ui/dom';
import { mountMainScreen } from './ui/mainScreen';
import './style.css';

const AUTOSAVE_MS = 15_000;
const TICK_MS = 100;
// Time away is not credited yet; offline income arrives in stage 3.
const MAX_TICK_SEC = 1;

function showEnding(ui: HTMLElement, id: string, onRestart: () => void): void {
  const entry = ENDINGS[id] ?? { title: id, text: '' };
  const card = el('div', 'card');
  card.append(
    el('div', 'card-kicker', 'Концовка открыта'),
    el('h2', 'card-title', `«${entry.title}»`),
    el('p', 'card-text', entry.text),
  );
  const again = el('button', 'dlg-choice', 'Попробовать снова');
  again.addEventListener('click', onRestart);
  card.append(again);
  ui.replaceChildren(card);
}

async function runPrologue(ui: HTMLElement, s: GameState): Promise<void> {
  const runner = new StoryRunner(prologue);
  const outcome = await playStory(ui, runner, {
    resume: s.prologue,
    onCheckpoint: (checkpoint) => {
      s.prologue = checkpoint;
      saveGame(s);
    },
  });
  s.prologue = null;

  if (outcome.kind === 'ending') {
    if (!s.endings.includes(outcome.id)) s.endings.push(outcome.id);
    saveGame(s);
    showEnding(ui, outcome.id, () => runPrologue(ui, s));
    return;
  }

  s.heroName = String(runner.get('hero_name'));
  s.skullName = String(runner.get('skull_name'));
  s.prologueDone = true;
  saveGame(s);
  startGame(ui, s);
}

function startGame(ui: HTMLElement, s: GameState): void {
  let dirty = false;
  const update = mountMainScreen(ui, s, () => (dirty = true));

  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = Math.min(MAX_TICK_SEC, (now - last) / 1000);
    last = now;
    addSouls(s, soulsPerSec(s) * dt);
    update();
  }, TICK_MS);

  setInterval(() => {
    saveGame(s);
    dirty = false;
  }, AUTOSAVE_MS);

  const flush = () => {
    if (dirty || document.visibilityState === 'hidden') saveGame(s);
    dirty = false;
  };
  document.addEventListener('visibilitychange', flush);
  window.addEventListener('pagehide', flush);
}

async function boot(): Promise<void> {
  initTelegram();
  await createStage(document.getElementById('fx') as HTMLCanvasElement);
  const ui = document.getElementById('ui')!;
  const s = loadGame();
  if (s.prologueDone) startGame(ui, s);
  else await runPrologue(ui, s);
}

boot();
