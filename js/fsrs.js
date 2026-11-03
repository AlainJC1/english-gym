// Spaced repetition based on FSRS-4.5 (default weights, 90% target retention).
const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5, FACTOR = 19 / 81, RETENTION = 0.9;
export const DAY = 864e5, MIN = 6e4;

const clampD = d => Math.min(10, Math.max(1, d));
const d0 = g => clampD(W[4] - (g - 3) * W[5]);
const s0 = g => Math.max(0.1, W[g - 1]);
const retr = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);
const ivlDays = s => Math.min(36500, Math.max(1, Math.round(s / FACTOR * (Math.pow(RETENTION, 1 / DECAY) - 1))));
const nextD = (d, g) => clampD(W[7] * d0(3) + (1 - W[7]) * (d - W[6] * (g - 3)));
const sRecall = (d, s, r, g) => s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
const sForget = (d, s, r) => Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]));

export function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
export function endOfDay(ts) { return startOfDay(ts) + DAY - 1; }
function dueAfter(days, now) { const d = new Date(startOfDay(now)); d.setDate(d.getDate() + days); d.setHours(3, 0, 0, 0); return d.getTime(); }

// rating: 1 Again, 2 Hard, 3 Good, 4 Easy
export function schedule(card, g, now = Date.now()) {
  const c = Object.assign({}, card);
  c.reps = (card.reps || 0) + 1;
  if (card.state === 'new' || !card.state) {
    c.d = d0(g); c.s = s0(g); c.firstSeen = now; c.last = now;
    if (g === 1) { c.state = 'learning'; c.due = now + MIN; }
    else if (g === 2) { c.state = 'learning'; c.due = now + 6 * MIN; }
    else { c.state = 'review'; c.due = dueAfter(ivlDays(c.s), now); }
    return c;
  }
  if (card.state === 'learning' || card.state === 'relearning') {
    c.d = nextD(card.d || d0(3), g);
    if (g === 1) { c.due = now + MIN; }
    else if (g === 2) { c.due = now + 6 * MIN; }
    else {
      c.s = g === 4 ? Math.max((card.s || 1) * 1.5, card.state === 'learning' ? W[3] : 1) : Math.max(card.s || 1, 0.5);
      c.state = 'review'; c.due = dueAfter(ivlDays(c.s), now); c.last = now;
    }
    return c;
  }
  // review
  const t = Math.max(0, (now - (card.last || now)) / DAY);
  const r = retr(t, card.s || 1);
  c.d = nextD(card.d || d0(3), g);
  c.last = now;
  if (g === 1) {
    c.s = Math.max(0.1, sForget(card.d || 5, card.s || 1, r));
    c.lapses = (card.lapses || 0) + 1;
    c.state = 'relearning'; c.due = now + 10 * MIN;
  } else {
    c.s = sRecall(card.d || 5, card.s || 1, r, g);
    c.state = 'review'; c.due = dueAfter(ivlDays(c.s), now);
  }
  return c;
}

export function fmtWait(ms) {
  if (ms < 60 * MIN) return Math.max(1, Math.round(ms / MIN)) + 'm';
  if (ms < 1.5 * DAY) return Math.round(ms / (60 * MIN)) + 'h';
  const d = Math.round(ms / DAY);
  if (d < 31) return d + 'd';
  if (d < 365) return Math.round(d / 30) + 'mo';
  return (Math.round(d / 36.5) / 10) + 'y';
}

export function preview(card, now = Date.now()) {
  return [1, 2, 3, 4].map(g => fmtWait(schedule(card, g, now).due - now));
}
