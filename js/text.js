// Text helpers: comparing dictation with a target, and reading AI answers back.
const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is', "it's": 'it is',
  "that's": 'that is', "what's": 'what is', "there's": 'there is', "i've": 'i have', "you've": 'you have', "we've": 'we have',
  "they've": 'they have', "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "she'll": 'she will', "he'll": 'he will',
  "it'll": 'it will', "i'd": 'i would', "you'd": 'you would', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
  "can't": 'cannot', "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "haven't": 'have not', "hasn't": 'has not', "couldn't": 'could not', "shouldn't": 'should not', "wouldn't": 'would not',
  "let's": 'let us', 'gonna': 'going to', 'wanna': 'want to', 'gotta': 'got to', 'okay': 'ok', 'ok': 'ok'
};
const NUMBERS = { '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '20': 'twenty', '30': 'thirty' };

export function normWords(s) {
  const base = String(s || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const out = [];
  base.split(' ').forEach(w => {
    if (!w) return;
    const x = CONTRACTIONS[w] || NUMBERS[w] || w.replace(/^'+|'+$/g, '');
    x.split(' ').forEach(p => { if (p) out.push(p); });
  });
  return out;
}

// Returns target words marked ok / missed, plus the score (0-1).
export function compareWords(target, said) {
  const a = normWords(target), b = normWords(said);
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const marks = []; let i = 0, j = 0;
  while (i < n) {
    if (j < m && a[i] === b[j]) { marks.push({ w: a[i], ok: true }); i++; j++; }
    else if (j < m && L[i][j + 1] >= L[i + 1][j]) { j++; }
    else { marks.push({ w: a[i], ok: false }); i++; }
  }
  const hits = marks.filter(x => x.ok).length;
  return { marks, score: n ? hits / n : 0, heard: b.join(' ') };
}

export function sameAnswer(a, b) { return normWords(a).join(' ') === normWords(b).join(' '); }

// Reads MISTAKE / PHRASE lines from a pasted AI answer.
export function parseSaveBlock(text) {
  const src = String(text || '');
  const m = src.match(/===\s*SAVE\s*===([\s\S]*?)(===\s*END\s*===|$)/i);
  const body = m ? m[1] : src;
  const mistakes = [], phrases = [];
  body.split(/\r?\n/).forEach(line => {
    const l = line.replace(/^[\s*\-•>]+/, '').replace(/\*\*/g, '').trim();
    let mm = l.match(/^MISTAKE\s*:\s*(.+)$/i);
    if (mm) {
      const p = mm[1].split('|').map(x => x.trim().replace(/^["“]|["”]$/g, ''));
      if (p[0] && p[1]) mistakes.push({ said: p[0], correct: p[1], rule: p[2] || '' });
      return;
    }
    mm = l.match(/^PHRASE\s*:\s*(.+)$/i);
    if (mm) {
      const p = mm[1].split('|').map(x => x.trim().replace(/^["“]|["”]$/g, ''));
      if (p[0]) phrases.push({ en: p[0], es: p[1] || '' });
    }
  });
  return { mistakes, phrases };
}
