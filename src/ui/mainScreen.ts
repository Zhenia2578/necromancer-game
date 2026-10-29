import { burst } from '../fx/stage';
import {
  buy,
  buyCount,
  buyPrice,
  isRevealed,
  owned,
  soulsPerSec,
  tap,
  type BuyMode,
} from '../game/economy';
import { LEGION } from '../game/legion';
import { activeQuest, checkQuests } from '../game/quests';
import type { GameState } from '../game/state';
import { el } from './dom';
import { fmt } from './format';
import { toast } from './toast';

const TABS: { id: string; icon: string; name: string; locked: boolean }[] = [
  { id: 'legion', icon: '💀', name: 'Легион', locked: false },
  { id: 'vassals', icon: '🧙', name: 'Вассалы', locked: true },
  { id: 'map', icon: '🗺️', name: 'Карта', locked: true },
  { id: 'shop', icon: '💎', name: 'Магазин', locked: true },
];

const BUY_MODES: BuyMode[] = [1, 10, 'max'];

interface UnitRow {
  root: HTMLElement;
  count: HTMLElement;
  prod: HTMLElement;
  button: HTMLButtonElement;
}

/** Builds the main game screen and returns an `update` to call every frame tick. */
export function mountMainScreen(ui: HTMLElement, s: GameState, onChange: () => void): () => void {
  ui.replaceChildren();
  document.body.dataset.scene = 'mass_grave';
  const view = el('div', 'main');

  // Header
  const header = el('header', 'main-header');
  const souls = el('div', 'souls');
  const rate = el('div', 'rate');
  header.append(souls, rate);

  // Tap zone
  const tapZone = el('button', 'tap-zone');
  tapZone.append(el('span', 'tap-circle'), el('span', 'tap-icon', '🪦'), el('span', 'tap-label', 'Ритуал'));
  tapZone.addEventListener('pointerdown', (e) => {
    const gain = tap(s);
    burst(e.clientX, e.clientY, 12);
    floatText(view, e.clientX, e.clientY, `+${fmt(gain)}`);
    tapZone.classList.remove('pulse');
    void tapZone.offsetWidth; // restart the pulse animation
    tapZone.classList.add('pulse');
    onChange();
  });

  // Legion panel
  const panel = el('section', 'panel');
  const modes = el('div', 'buy-modes');
  let mode: BuyMode = 1;
  const modeButtons = BUY_MODES.map((m) => {
    const b = el('button', 'mode', m === 'max' ? 'MAX' : `×${m}`);
    b.addEventListener('click', () => {
      mode = m;
      modeButtons.forEach((other, i) => other.classList.toggle('active', BUY_MODES[i] === m));
      update();
    });
    return b;
  });
  modeButtons[0].classList.add('active');
  modes.append(...modeButtons);

  const list = el('div', 'unit-list');
  const rows: UnitRow[] = LEGION.map((unit) => {
    const root = el('div', 'unit');
    const icon = el('div', 'unit-icon', unit.emoji);
    const info = el('div', 'unit-info');
    const title = el('div', 'unit-name', unit.name);
    const count = el('span', 'unit-count');
    title.append(count);
    const prod = el('div', 'unit-prod');
    info.append(title, el('div', 'unit-desc', unit.desc), prod);
    const button = el('button', 'unit-buy');
    button.addEventListener('click', () => {
      if (buy(s, unit, mode) > 0) {
        const r = button.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 10);
        onChange();
      }
    });
    root.append(icon, info, button);
    list.append(root);
    return { root, count, prod, button };
  });
  const teaser = el('div', 'unit teaser');
  teaser.append(el('div', 'unit-icon', '❔'), el('div', 'unit-info', '???'));
  list.append(teaser);
  panel.append(modes, list);

  // Quest bar
  const quest = el('div', 'quest');

  // Tabs
  const tabs = el('nav', 'tabs');
  for (const t of TABS) {
    const b = el('button', 'tab', `${t.locked ? '🔒' : t.icon} ${t.name}`);
    if (t.id === 'legion') b.classList.add('active');
    if (t.locked) {
      b.classList.add('locked');
      b.addEventListener('click', () => toast('Откроется по сюжету'));
    }
    tabs.append(b);
  }

  view.append(header, tapZone, panel, quest, tabs);
  ui.append(view);

  function update(): void {
    const done = checkQuests(s);
    if (done) {
      toast(`📜 Задание выполнено: ${done.title}`);
      onChange();
    }

    souls.textContent = `👻 ${fmt(s.souls)}`;
    rate.textContent = `${fmt(soulsPerSec(s))} душ/сек`;

    let firstHidden = -1;
    LEGION.forEach((unit, i) => {
      const row = rows[i];
      const shown = isRevealed(s, i);
      row.root.hidden = !shown;
      if (!shown) {
        if (firstHidden === -1) firstHidden = i;
        return;
      }
      const n = owned(s, unit.id);
      row.count.textContent = n ? ` · ${n}` : '';
      row.prod.textContent = `+${fmt(unit.prod)}/сек каждый${n ? ` · всего ${fmt(unit.prod * n)}` : ''}`;
      const count = buyCount(s, unit, mode);
      const qty = mode === 'max' ? Math.max(1, count) : mode;
      row.button.textContent = `${qty > 1 ? `+${qty} ` : ''}👻 ${fmt(buyPrice(s, unit, mode))}`;
      row.button.disabled = count === 0;
    });
    teaser.hidden = firstHidden === -1;

    const q = activeQuest(s);
    if (q) {
      const { value, goal } = q.progress(s);
      quest.textContent = `📜 ${q.title}: ${Math.min(value, goal)}/${goal}`;
    } else {
      quest.textContent = '📜 Акт I скоро. Пока копи души 💀';
    }
  }

  update();
  return update;
}

function floatText(parent: HTMLElement, x: number, y: number, text: string): void {
  const node = el('div', 'float-text', text);
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  parent.append(node);
  setTimeout(() => node.remove(), 800);
}
