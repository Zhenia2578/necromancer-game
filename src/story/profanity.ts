// Basic profanity filter for player-entered names. It is not exhaustive; the server
// should run the same check before names are ever shown to other players.

// Latin and digit look-alikes that people use to dodge filters.
const LOOKALIKES: Record<string, string> = {
  a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у',
  '0': 'о', '1': 'и', '3': 'з', '4': 'ч', '6': 'б', '@': 'а', 'ё': 'е',
};

// Roots matched anywhere inside a word.
const ANYWHERE = [
  'хуй', 'хуе', 'хуя', 'хуи', 'пизд', 'пезд', 'бля', 'сука', 'суки', 'сучк', 'сучар',
  'мудак', 'мудил', 'пидор', 'пидар', 'залуп', 'гандон', 'гондон', 'шлюх',
  'дроч', 'жоп', 'говн', 'дерьм',
];

// The "еб" family produces false positives inside normal words (хлебушек, Глеб),
// so it only counts at the start of a word, optionally after a verb prefix.
const EB_PATTERN = /^(за|на|по|у|вы|от|раз|рас|съ|до|при|об|под|пере|про|из|вз)?еб/;

const LATIN_WORDS = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'nigger', 'fag'];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => LOOKALIKES[ch] ?? ch)
    .join('');
}

export function isProfane(input: string): boolean {
  const lower = input.toLowerCase();
  const latinOnly = lower.replace(/[^a-z]/g, '');
  if (LATIN_WORDS.some((w) => latinOnly.includes(w))) return true;

  const words = normalize(input).split(/[^а-я]+/).filter(Boolean);
  const joined = words.join('');
  if (ANYWHERE.some((root) => joined.includes(root))) return true;
  return words.some((w) => EB_PATTERN.test(w));
}
