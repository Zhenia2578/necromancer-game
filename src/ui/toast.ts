import { el } from './dom';

let host: HTMLElement | null = null;

/** Short message at the top of the screen that fades out by itself. */
export function toast(text: string, ms = 2200): void {
  if (!host) {
    host = el('div', 'toasts');
    document.body.append(host);
  }
  const node = el('div', 'toast', text);
  host.append(node);
  setTimeout(() => node.classList.add('out'), ms);
  setTimeout(() => node.remove(), ms + 400);
}
