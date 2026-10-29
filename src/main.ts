import prologue from '../story/prologue.ink';
import { createStage } from './fx/stage';
import { ENDINGS } from './story/endings';
import { StoryRunner } from './story/runner';
import { initTelegram } from './telegram';
import { playStory, type StoryOutcome } from './ui/dialogue';
import { el } from './ui/dom';
import './style.css';

const QUEST_TEXT: Record<string, string> = {
  raise_10: 'Поднять 10 мертвецов',
};

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

// Placeholder until the economy screen lands in stage 2.
function showMainScreen(ui: HTMLElement, outcome: Extract<StoryOutcome, { kind: 'finished' }>): void {
  const card = el('div', 'card');
  card.append(el('div', 'card-kicker', 'Пролог пройден'), el('h2', 'card-title', 'Братская могила'));
  for (const quest of outcome.quests) card.append(el('p', 'card-text', `📜 Задание: ${QUEST_TEXT[quest] ?? quest}`));
  card.append(el('p', 'card-muted', 'Главный экран появится на этапе 2.'));
  ui.replaceChildren(card);
}

async function runPrologue(ui: HTMLElement): Promise<void> {
  const outcome = await playStory(ui, new StoryRunner(prologue));
  if (outcome.kind === 'ending') {
    showEnding(ui, outcome.id, () => runPrologue(ui));
  } else {
    showMainScreen(ui, outcome);
  }
}

async function boot(): Promise<void> {
  initTelegram();
  await createStage(document.getElementById('fx') as HTMLCanvasElement);
  await runPrologue(document.getElementById('ui')!);
}

boot();
