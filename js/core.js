// App state, storage, dates, logging and shared UI helpers.
import { dbAll, dbPut, dbDel, dbPutMany } from './db.js';
import { CATS, PLAN_CAR, PLAN_TRANSIT, WEEKS, MONTH_FOCUS, EXTRA_TOPICS } from '../data/content.js';
import { DECK, DECK_VERSION } from '../data/deck.js';
import { speak, stopSpeaking } from './audio.js';
import { startOfDay, endOfDay } from './fsrs.js';

export const APP_VERSION = '1.0.1';
export const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
export const DEFAULTS = { startDate: '2026-11-09', commute: 'car', newPerDay: 10, voiceURI: '', rate: 0.95, autoplay: true, ai: 'claude' };
export const S = { settings: Object.assign({}, DEFAULTS), log: [], cards: [], phrases: [], mistakes: [], tests: [], revlog: {}, timer: null, stats: {}, custom: [] };

/* ---------- Storage ---------- */
export const setKV = (key, value) => dbPut('kv', { key, value });
export function saveSettings() { return setKV('settings', S.settings); }
export function saveStats() { return setKV('stats', S.stats); }

export async function loadAll() {
  const [kv, log, cards, phrases, mistakes, tests] = await Promise.all(['kv', 'log', 'cards', 'phrases', 'mistakes', 'tests'].map(dbAll));
  const m = Object.fromEntries(kv.map(r => [r.key, r.value]));
  S.settings = Object.assign({}, DEFAULTS, m.settings || {});
  S.revlog = m.revlog || {};
  S.timer = m.timer || null;
  S.stats = m.stats || {};
  S.custom = m.custom || [];
  S.log = log; S.cards = cards; S.phrases = phrases; S.mistakes = mistakes; S.tests = tests;
  if ((m.deckVersion || 0) < DECK_VERSION) await seedDeck();
}

async function seedDeck() {
  const have = new Set(S.cards.map(c => c.id));
  const add = [];
  DECK.forEach((d, i) => {
    const id = 'deck-' + hash(d.es + '|' + d.en);
    if (have.has(id)) return;
    add.push({ id, kind: 'prod', src: 'deck', cat: d.cat, es: d.es, en: d.en, hint: d.hint, note: d.note, state: 'new', order: i, created: Date.now() });
  });
  if (add.length) { await dbPutMany('cards', add); S.cards.push(...add); }
  await setKV('deckVersion', DECK_VERSION);
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

/* ---------- Dates ---------- */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = n => String(n).padStart(2, '0');
export const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const todayKey = () => keyOf(new Date());
export const validKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
export function dayNum(k) { const a = k.split('-').map(Number); return Math.round(Date.UTC(a[0], a[1] - 1, a[2]) / 864e5); }
export function keyFromNum(n) { const d = new Date(n * 864e5); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
export const dow = k => new Date(dayNum(k) * 864e5).getUTCDay();
export function fmtDay(k) { const a = k.split('-').map(Number); return DOW[dow(k)] + ', ' + MON[a[1] - 1] + ' ' + a[2]; }
export function fmtShort(k) { const a = k.split('-').map(Number); return MON[a[1] - 1] + ' ' + a[2]; }
export function fmtLong(k) { const a = k.split('-').map(Number); return MON[a[1] - 1] + ' ' + a[2] + ', ' + a[0]; }
export const fmtTime = ts => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const fmtH = min => { const h = min / 60; return h >= 100 ? String(Math.round(h)) : (Math.round(h * 10) / 10).toFixed(1); };

/* ---------- Plan ---------- */
export function startKey() { return validKey(S.settings.startDate) ? S.settings.startDate : DEFAULTS.startDate; }
export function weekInfo(k = todayKey()) {
  const s = dayNum(startKey()), n = dayNum(k);
  if (n < s) return { week: 0, phase: 0, daysToStart: s - n };
  const week = Math.floor((n - s) / 7) + 1;
  return { week, phase: week <= 12 ? 1 : week <= 25 ? 2 : week <= 38 ? 3 : 4 };
}
export function planFor(k = todayKey()) { return ((S.settings.commute === 'transit' ? PLAN_TRANSIT : PLAN_CAR)[dow(k)]) || []; }
export function weekFocus(k = todayKey()) {
  const w = weekInfo(k);
  if (w.week >= 1 && w.week <= 12) return Object.assign({ kind: 'week', week: w.week }, WEEKS[w.week - 1]);
  if (w.week > 12) {
    const m = Number(k.split('-')[1]);
    return { kind: 'month', text: MONTH_FOCUS[m] || MONTH_FOCUS[1], topic: EXTRA_TOPICS[w.week % EXTRA_TOPICS.length] };
  }
  return { kind: 'setup', topic: WEEKS[0].topic };
}
export function topicNow() { return weekFocus().topic || EXTRA_TOPICS[0]; }

/* ---------- Practice log ---------- */
export function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
export function emit() { window.dispatchEvent(new Event('eg:data')); }

export async function addLog(cat, min, src = 'manual') {
  min = Math.round(Number(min));
  if (!CAT[cat] || !(min >= 1 && min <= 600)) return null;
  const e = { id: uid('l'), day: todayKey(), cat, min, ts: Date.now(), src };
  S.log.push(e);
  await dbPut('log', e);
  emit();
  return e;
}
export async function delLog(id) { S.log = S.log.filter(e => e.id !== id); await dbDel('log', id); emit(); }

export function dayTotals(k) {
  const t = { total: 0, input: 0, output: 0, study: 0, byCat: {} };
  S.log.forEach(e => {
    if (e.day !== k) return;
    const g = (CAT[e.cat] || {}).group || 'input';
    t.total += e.min; t[g] += e.min; t.byCat[e.cat] = (t.byCat[e.cat] || 0) + e.min;
  });
  return t;
}
export function totalsByDay() { const m = {}; S.log.forEach(e => { m[e.day] = (m[e.day] || 0) + e.min; }); return m; }
export const MIN_DAY = 15;
export function streaks() {
  const by = totalsByDay();
  let n = dayNum(todayKey());
  if ((by[keyFromNum(n)] || 0) < MIN_DAY) n -= 1;
  let cur = 0;
  while ((by[keyFromNum(n)] || 0) >= MIN_DAY) { cur++; n--; }
  const nums = Object.keys(by).filter(k => by[k] >= MIN_DAY).map(dayNum).sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  nums.forEach(x => { run = prev !== null && x === prev + 1 ? run + 1 : 1; prev = x; best = Math.max(best, run); });
  return { cur, best: Math.max(best, cur) };
}

/* ---------- Timer (manual practice outside the app) ---------- */
export async function startTimer(cat) { S.timer = { cat, start: Date.now() }; await setKV('timer', S.timer); emit(); }
export async function stopTimer() {
  if (!S.timer) return null;
  const min = Math.min(600, Math.max(1, Math.round((Date.now() - S.timer.start) / 60000)));
  const cat = S.timer.cat;
  S.timer = null; await setKV('timer', null);
  return addLog(cat, min, 'timer');
}
export async function cancelTimer() { S.timer = null; await setKV('timer', null); emit(); }

/* ---------- Automatic time tracking inside practice screens ---------- */
let act = null;
export function trackStart(cat) { trackStop(); act = { cat, acc: 0, last: Date.now(), paused: document.hidden }; }
export function trackPing() {
  if (!act) return;
  const now = Date.now();
  if (!act.paused) act.acc += Math.min(now - act.last, 120000);
  act.last = now; act.paused = false;
}
function flush(keep) {
  if (!act) return 0;
  trackPing();
  const acc = act.acc, cat = act.cat;
  if (keep) act.acc = 0; else act = null;
  if (acc >= 45000) { addLog(cat, Math.max(1, Math.round(acc / 60000)), 'auto'); return Math.round(acc / 60000); }
  if (keep && act) act.acc = acc;
  return 0;
}
export function trackStop() { return flush(false); }
['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, trackPing, true));
document.addEventListener('visibilitychange', () => {
  if (!act) return;
  if (document.hidden) { flush(true); if (act) act.paused = true; }
  else { act.last = Date.now(); act.paused = false; }
});

export function say(text, opts = {}) {
  trackPing();
  return speak(text, Object.assign({ voiceURI: S.settings.voiceURI, rate: S.settings.rate }, opts)).then(r => { trackPing(); return r; });
}
export { stopSpeaking };

/* ---------- Cards ---------- */
export function cardCounts(now = Date.now()) {
  const eod = endOfDay(now), sod = startOfDay(now);
  let review = 0, learning = 0, newAvail = 0, newToday = 0, learnSoon = null;
  S.cards.forEach(c => {
    if (c.suspended) return;
    if (c.state === 'review' && c.due <= eod) review++;
    else if (c.state === 'learning' || c.state === 'relearning') { learning++; if (learnSoon === null || c.due < learnSoon) learnSoon = c.due; }
    else if (c.state === 'new' || !c.state) newAvail++;
    if (c.firstSeen && c.firstSeen >= sod) newToday++;
  });
  const newLeft = Math.min(newAvail, Math.max(0, S.settings.newPerDay - newToday));
  return { review, learning, newLeft, newAvail, newToday, learnSoon, total: S.cards.length };
}
export async function putCard(c) {
  const i = S.cards.findIndex(x => x.id === c.id);
  if (i >= 0) S.cards[i] = c; else S.cards.push(c);
  await dbPut('cards', c);
}
export async function delCard(id) { S.cards = S.cards.filter(c => c.id !== id); await dbDel('cards', id); }
export function nextOrder() { return S.cards.reduce((m, c) => Math.max(m, c.order || 0), 0) + 1; }
export async function addCard(fields) {
  const c = Object.assign({ id: uid('c'), kind: 'prod', src: 'user', cat: 'user', hint: '', note: '', state: 'new', order: nextOrder(), created: Date.now() }, fields);
  await putCard(c);
  return c;
}
export function bumpRevlog(again) {
  const k = todayKey();
  const r = S.revlog[k] || { n: 0, again: 0 };
  r.n++; if (again) r.again++;
  S.revlog[k] = r;
  return setKV('revlog', S.revlog);
}

/* ---------- Phrases and mistakes ---------- */
export async function addPhrase(en, es = '', src = '') {
  en = String(en || '').trim(); es = String(es || '').trim();
  if (!en) return null;
  const dup = S.phrases.find(p => p.en.toLowerCase() === en.toLowerCase());
  if (dup) { if (es && !dup.es) { dup.es = es; await dbPut('phrases', dup); } return dup; }
  const p = { id: uid('p'), en, es, src, day: todayKey(), ts: Date.now(), cardId: null };
  S.phrases.push(p); await dbPut('phrases', p); emit();
  return p;
}
export async function phraseToCard(p) {
  if (!p.es || p.cardId) return null;
  const c = await addCard({ es: p.es, en: p.en, cat: 'phrase', src: 'phrase', note: p.src ? 'From: ' + p.src : '' });
  p.cardId = c.id; await dbPut('phrases', p);
  return c;
}
export async function addMistake(said, correct, rule = '', src = 'Other') {
  said = String(said || '').trim(); correct = String(correct || '').trim();
  if (!said || !correct) return null;
  const dup = S.mistakes.find(m => m.said.toLowerCase() === said.toLowerCase() && m.correct.toLowerCase() === correct.toLowerCase());
  if (dup) return dup;
  const m = { id: uid('m'), said, correct, rule: String(rule || '').trim(), src, day: todayKey(), ts: Date.now(), focus: false, cardId: null };
  S.mistakes.push(m); await dbPut('mistakes', m); emit();
  return m;
}
export async function mistakeToCard(m) {
  if (m.cardId) return null;
  const c = await addCard({ kind: 'fix', es: m.said, en: m.correct, note: m.rule, cat: 'mistake', src: 'mistake' });
  m.cardId = c.id; await dbPut('mistakes', m);
  return c;
}

/* ---------- UI helpers ---------- */
export function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export const go = path => { location.hash = path; };

let toastT = null;
export function toast(msg, ms) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, ms || Math.max(2600, msg.length * 55));
}

// In-app confirmation sheet. Resolves true or false.
export function ask(message, okLabel = 'OK', danger = false) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><p class="sheet-msg"></p><div class="sheet-actions"><button class="btn" data-r="0">Cancel</button><button class="btn ' + (danger ? 'danger' : 'primary') + '" data-r="1"></button></div></div>';
    wrap.querySelector('.sheet-msg').textContent = message;
    wrap.querySelector('[data-r="1"]').textContent = okLabel;
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-r]');
      if (!b && e.target !== wrap) return;
      wrap.remove();
      resolve(b ? b.dataset.r === '1' : false);
    });
    document.body.appendChild(wrap);
    wrap.querySelector('[data-r="1"]').focus();
  });
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch (e) { return false; }
}

// Copies a prompt and opens Claude (prefilled) or Gemini.
export async function openAI(prompt, which) {
  const app = which || S.settings.ai || 'claude';
  const copied = await copyText(prompt);
  const url = app === 'gemini' ? 'https://gemini.google.com/app' : 'https://claude.ai/new?q=' + encodeURIComponent(prompt);
  toast(copied ? (app === 'gemini' ? 'Prompt copied. Paste it in Gemini.' : 'Prompt copied. Opening Claude…') : 'Opening…');
  window.open(url, '_blank', 'noopener');
}

export function header(title, back, sub) {
  return '<header class="scr-head">' +
    (back ? '<a class="back" href="#' + esc(back) + '" aria-label="Back">‹</a>' : '') +
    '<div class="scr-title"><h1>' + esc(title) + '</h1>' + (sub ? '<p class="sub">' + esc(sub) + '</p>' : '') + '</div></header>';
}
