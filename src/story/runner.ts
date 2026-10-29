import { Story } from 'inkjs';

export type Tags = Record<string, string>;

export type Step =
  | { type: 'line'; text: string; speaker: string | null; tags: Tags }
  | { type: 'choices'; options: string[] }
  | { type: 'end' };

/** Parses ink tags of the form `key:value` (or bare `key`) into a map. */
function parseTags(raw: string[]): Tags {
  const tags: Tags = {};
  for (const tag of raw) {
    const i = tag.indexOf(':');
    if (i === -1) tags[tag.trim()] = '';
    else tags[tag.slice(0, i).trim()] = tag.slice(i + 1).trim();
  }
  return tags;
}

/** Thin step-by-step wrapper around an ink story. */
export class StoryRunner {
  private story: Story;

  constructor(json: string) {
    this.story = new Story(json);
  }

  next(): Step {
    if (this.story.canContinue) {
      const text = (this.story.Continue() ?? '').trim();
      const tags = parseTags(this.story.currentTags ?? []);
      return { type: 'line', text, speaker: tags.speaker ?? null, tags };
    }
    if (this.story.currentChoices.length) {
      return { type: 'choices', options: this.story.currentChoices.map((c) => c.text) };
    }
    return { type: 'end' };
  }

  choose(index: number): void {
    this.story.ChooseChoiceIndex(index);
  }

  get(name: string): unknown {
    return this.story.variablesState.$(name);
  }

  set(name: string, value: string | number | boolean): void {
    this.story.variablesState.$(name, value);
  }
}
