import { burst } from '../fx/stage';
import { isProfane } from '../story/profanity';
import type { StoryCheckpoint } from '../game/state';
import { StoryRunner, type Step } from '../story/runner';
import { SKULL_NAMES } from '../story/skullNames';
import { el, wait } from './dom';

export type StoryOutcome =
  | { kind: 'ending'; id: string }
  | { kind: 'finished'; unlocks: string[]; quests: string[] };

const TYPE_MS = 22;
const SKULL_PICK_COUNT = 6;

/** Display name for a speaker id; hero and skull names come from story variables. */
function speakerName(id: string, runner: StoryRunner): string {
  switch (id) {
    case 'inquisitor': return 'Великий Инквизитор';
    case 'crowd': return 'Толпа';
    case 'nameless': return 'Безымянная';
    case 'hero': return String(runner.get('hero_name') || 'Лекарь');
    case 'skull': return String(runner.get('skull_name') || 'Череп');
    default: return id;
  }
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface PlayOptions {
  /** Resume from a checkpoint saved by a previous session. */
  resume?: StoryCheckpoint | null;
  /** Called before every step with a state that replays that step when resumed. */
  onCheckpoint?: (checkpoint: StoryCheckpoint) => void;
}

/** Plays an ink story as a visual-novel dialogue and resolves when it ends. */
export async function playStory(
  root: HTMLElement,
  runner: StoryRunner,
  { resume, onCheckpoint }: PlayOptions = {},
): Promise<StoryOutcome> {
  root.replaceChildren();
  const view = el('div', 'dlg');
  const stage = el('div', 'dlg-stage');
  const box = el('div', 'dlg-box');
  const speaker = el('div', 'dlg-speaker');
  const text = el('div', 'dlg-text');
  const actions = el('div', 'dlg-actions');
  const hint = el('div', 'dlg-hint', '▼');
  box.append(speaker, text, actions, hint);
  view.append(stage, box);
  root.append(view);

  // A single tap handler; each phase installs what a tap should do right now.
  let onTap: (() => void) | null = null;
  view.addEventListener('click', () => onTap?.());

  const showLine = (step: Extract<Step, { type: 'line' }>) =>
    new Promise<void>((resolve) => {
      const isNarration = !step.speaker;
      box.dataset.speaker = step.speaker ?? 'narration';
      speaker.textContent = isNarration ? '' : speakerName(step.speaker!, runner);
      speaker.hidden = isNarration;
      text.classList.toggle('narration', isNarration);
      actions.replaceChildren();
      hint.hidden = true;

      let shown = 0;
      const full = step.text;
      text.textContent = '';
      const timer = setInterval(() => {
        shown++;
        text.textContent = full.slice(0, shown);
        if (shown >= full.length) finishTyping();
      }, TYPE_MS);

      function finishTyping() {
        clearInterval(timer);
        text.textContent = full;
        hint.hidden = false;
        onTap = () => {
          onTap = null;
          resolve();
        };
      }
      onTap = finishTyping;
    });

  const showChoices = (options: string[]) =>
    new Promise<number>((resolve) => {
      hint.hidden = true;
      onTap = null;
      actions.replaceChildren(
        ...options.map((label, i) => {
          const btn = el('button', 'dlg-choice', label);
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            actions.replaceChildren();
            resolve(i);
          });
          return btn;
        }),
      );
    });

  /** Text field with submit; `validate` returns an error message or null. */
  const askText = (placeholder: string, maxLength: number, validate: (v: string) => string | null) =>
    new Promise<string>((resolve) => {
      hint.hidden = true;
      onTap = null;
      const form = el('form', 'dlg-form');
      const input = el('input', 'dlg-input');
      input.placeholder = placeholder;
      input.maxLength = maxLength;
      input.autocomplete = 'off';
      const submit = el('button', 'dlg-choice', 'Готово');
      submit.type = 'submit';
      const error = el('div', 'dlg-error');
      form.append(input, submit);
      form.addEventListener('click', (e) => e.stopPropagation());
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = input.value.trim().replace(/\s+/g, ' ');
        const problem = validate(value);
        if (problem) {
          error.textContent = problem;
          return;
        }
        actions.replaceChildren();
        resolve(value);
      });
      actions.replaceChildren(form, error);
      setTimeout(() => input.focus(), 50);
    });

  const askHeroName = async () => {
    const name = await askText('Твоё имя', 16, (v) => {
      if (isProfane(v)) return '«Не лги мне. Как тебя звали на самом деле?»';
      if (!/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё' -]{1,15}$/.test(v)) return 'От 2 до 16 букв.';
      return null;
    });
    runner.set('hero_name', name);
  };

  const pickSkullName = () =>
    new Promise<void>((resolve) => {
      hint.hidden = true;
      onTap = null;
      let pool = shuffle(SKULL_NAMES);
      let offset = 0;

      const choose = (id: string, name: string) => {
        runner.set('skull_name_id', id);
        runner.set('skull_name', name);
        actions.replaceChildren();
        resolve();
      };

      const render = () => {
        if (offset + SKULL_PICK_COUNT > pool.length) {
          pool = shuffle(SKULL_NAMES);
          offset = 0;
        }
        const grid = el('div', 'dlg-grid');
        for (const option of pool.slice(offset, offset + SKULL_PICK_COUNT)) {
          const btn = el('button', 'dlg-choice', option.name);
          btn.addEventListener('click', () => choose(option.id, option.name));
          grid.append(btn);
        }
        const more = el('button', 'dlg-choice secondary', '🎲 Ещё варианты');
        more.addEventListener('click', () => {
          offset += SKULL_PICK_COUNT;
          render();
        });
        const own = el('button', 'dlg-choice secondary', '✍️ Своё имя');
        own.addEventListener('click', async () => {
          const name = await askText('Как назовёшь череп?', 24, (v) =>
            v.length < 1 ? 'Хоть что-нибудь.' : null,
          );
          choose(isProfane(name) ? 'profane' : 'custom', name);
        });
        const row = el('div', 'dlg-row');
        row.append(more, own);
        const wrap = el('div');
        wrap.append(grid, row);
        wrap.addEventListener('click', (e) => e.stopPropagation());
        actions.replaceChildren(wrap);
      };
      render();
    });

  const tutorialTap = () =>
    new Promise<void>((resolve) => {
      hint.hidden = true;
      onTap = null;
      const corpse = el('button', 'corpse');
      corpse.append(el('span', 'corpse-body', '🧍‍♀️'), el('span', 'corpse-label', 'Коснись тела'));
      corpse.addEventListener('click', async (e) => {
        e.stopPropagation();
        const r = corpse.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 60);
        corpse.classList.add('risen');
        await wait(900);
        corpse.remove();
        resolve();
      });
      stage.append(corpse);
    });

  let ending: string | null = null;
  const unlocks: string[] = [];
  const quests: string[] = [];

  if (resume) {
    runner.loadState(resume.ink);
    if (resume.scene) document.body.dataset.scene = resume.scene;
  }

  for (;;) {
    onCheckpoint?.({ ink: runner.saveState(), scene: document.body.dataset.scene ?? null });
    const step = runner.next();
    if (step.type === 'end') break;
    if (step.type === 'choices') {
      runner.choose(await showChoices(step.options));
      continue;
    }

    const { tags } = step;
    if (tags.scene) document.body.dataset.scene = tags.scene;
    if (tags.ending) ending = tags.ending;
    if (tags.unlock) unlocks.push(tags.unlock);
    if (tags.quest) quests.push(tags.quest);
    // Blocking tags sit on the line after which the game waits for the player.
    if (step.text) await showLine(step);
    if (tags.input === 'hero_name') await askHeroName();
    if (tags.pick === 'skull_name') await pickSkullName();
    if (tags.tutorial) await tutorialTap();
  }

  onTap = null;
  return ending ? { kind: 'ending', id: ending } : { kind: 'finished', unlocks, quests };
}
