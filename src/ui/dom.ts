/** Creates an element with optional class and text. Text is set via textContent, never as HTML. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
