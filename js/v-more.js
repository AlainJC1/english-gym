import { S, CAT, esc, header, todayKey, fmtShort, fmtLong, fmtH, dayNum, keyFromNum, dow, dayTotals, streaks, startKey, validKey,
  addPhrase, phraseToCard, addMistake, mistakeToCard, addCard, saveSettings, saveStats, toast, ask, uid, say, openAI, trackStart, APP_VERSION, DEFAULTS, emit, setKV, copyText } from './core.js';
import { dbPut, dbDel, dbClear, dbPutMany, ALL_STORES } from './db.js';
import { GRAMMAR } from '../data/grammar.js';
import { GROUPS, CHECKS, MILESTONES, GUIDE, TRANSLATE_PROMPT, AI_SCENARIOS, WRITE_PROMPT, PLAN_DOC_URL } from '../data/content.js';
import { sameAnswer } from './text.js';
import { enVoices, accentOf, speak } from './audio.js';
import { importerHTML, bindImporter } from './ui.js';

export function renderMore(box, params) {
  const [sub, id] = params;
  if (sub === 'phrases') return phrases(box);
  if (sub === 'mistakes') return mistakes(box);
  if (sub === 'grammar' && id) return lesson(box, id);
  if (sub === 'grammar') return grammarList(box);
  if (sub === 'progress') return progress(box);
  if (sub === 'guide') return guide(box);
  if (sub === 'settings') return settings(box);
  return home(box);
}

function home(box) {
  const newPh = S.phrases.filter(p => !p.cardId).length;
  const items = [
    ['more/phrases', 'Phrase inbox', newPh ? newPh + ' not in your cards yet' : 'Save phrases you want to say'],
    ['more/mistakes', 'Mistake log', S.mistakes.length + ' logged · star 3 as weekly focus'],
    ['more/grammar', 'Grammar', '16 topics with exercises'],
    ['more/progress', 'Progress', 'Hours, streak, weeks and checkpoints'],
    ['more/guide', 'Your plan', 'Phases, methods and rules'],
    ['more/settings', 'Settings and backup', 'Start date, voice, cards per day']
  ];
  box.innerHTML = header('More') + '<ul class="list">' + items.map(i => '<li><a class="row" href="#' + i[0] + '"><span class="txt"><span class="desc">' + esc(i[1]) + '</span><span class="cat">' + esc(i[2]) + '</span></span><span class="chev">›</span></a></li>').join('') + '</ul>';
}

/* ---------- Phrases ---------- */
function phrases(box) {
  function draw() {
    const list = S.phrases.slice().sort((a, b) => b.ts - a.ts);
    const noEs = list.filter(p => !p.es);
    box.querySelector('#list').innerHTML = list.length ? list.map(p => '<li><div class="row col"><span class="desc">' + esc(p.en) + '</span>' +
      (p.es ? '<span class="sub">' + esc(p.es) + '</span>' : '<span class="sub muted">No Spanish yet</span>') +
      '<span class="meta">' + esc(fmtShort(p.day)) + (p.src ? ' · ' + esc(p.src) : '') + ' ' + (p.cardId ? '<span class="pill good">In cards</span>' : '<span class="pill next">New</span>') + '</span>' +
      '<span class="btnrow"><button class="linkbtn" data-a="play" data-id="' + p.id + '">Play</button>' +
      (!p.cardId && p.es ? '<button class="linkbtn" data-a="card" data-id="' + p.id + '">Make a card</button>' : '') +
      '<button class="linkbtn danger" data-a="del" data-id="' + p.id + '">Delete</button></span></div></li>').join('')
      : '<li class="empty">Your inbox is empty. When a show, podcast or class gives you a phrase you want to use, save it here.</li>';
    box.querySelector('#tr').hidden = !noEs.length;
    box.querySelector('#trn').textContent = noEs.length;
  }
  box.innerHTML = header('Phrase inbox', 'more', 'Phrases, not single words.') +
    '<form class="card stack" id="f" novalidate><label for="en">English phrase</label><input id="en" maxlength="200" placeholder="e.g. I came up with a better idea.">' +
    '<label for="es">Spanish meaning (optional)</label><input id="es" maxlength="200" placeholder="e.g. Se me ocurrió una mejor idea.">' +
    '<label for="src">Where you heard it (optional)</label><input id="src" maxlength="80" placeholder="e.g. Modern Family, S1E3">' +
    '<label class="check"><input type="checkbox" id="mk" checked> Make a card too (needs the Spanish)</label>' +
    '<button class="btn primary" type="submit">Save phrase</button></form>' +
    '<section class="card" id="tr" hidden><p><b id="trn">0</b> phrases have no Spanish. Let the AI translate them, then paste the answer below.</p>' +
    '<div class="btnrow"><button class="btn primary" data-a="ai" data-app="claude">Translate in Claude</button><button class="btn" data-a="ai" data-app="gemini">Gemini</button></div></section>' +
    importerHTML('phrases', 'Paste the translations') +
    '<ul class="list" id="list"></ul>';
  box.querySelector('#f').addEventListener('submit', async e => {
    e.preventDefault();
    const en = box.querySelector('#en').value.trim(), es = box.querySelector('#es').value.trim(), src = box.querySelector('#src').value.trim();
    if (!en) { toast('Write the English phrase.'); return; }
    const p = await addPhrase(en, es, src);
    if (p && box.querySelector('#mk').checked && p.es) await phraseToCard(p);
    box.querySelector('#en').value = ''; box.querySelector('#es').value = '';
    box.querySelector('#en').focus();
    toast(p && p.cardId ? 'Saved as a phrase and a card.' : 'Phrase saved.');
    draw();
  });
  bindImporter(box, 'AI');
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a, p = S.phrases.find(x => x.id === b.dataset.id);
    if (a === 'ai') { const list = S.phrases.filter(x => !x.es).map(x => x.en).join('\n'); openAI(TRANSLATE_PROMPT.replace('{TEXT}', list), b.dataset.app); return; }
    if (!p) return;
    if (a === 'play') say(p.en);
    else if (a === 'card') { await phraseToCard(p); toast('Card added.'); draw(); }
    else if (a === 'del' && await ask('Delete this phrase?', 'Delete', true)) { S.phrases = S.phrases.filter(x => x.id !== p.id); await dbDel('phrases', p.id); emit(); draw(); }
  });
  window.addEventListener('eg:data', draw);
  draw();
  return () => window.removeEventListener('eg:data', draw);
}

/* ---------- Mistakes ---------- */
function mistakes(box) {
  function draw() {
    const list = S.mistakes.slice().sort((a, b) => b.ts - a.ts);
    const foc = list.filter(m => m.focus);
    box.querySelector('#focus').innerHTML = foc.length ? '<div class="focusbox"><p class="eyebrow">This week\'s focus</p><ol>' + foc.map(m => '<li><b>' + esc(m.correct) + '</b>' + (m.rule ? ' <span class="hint">· ' + esc(m.rule) + '</span>' : '') + '</li>').join('') + '</ol></div>' : '';
    box.querySelector('#list').innerHTML = list.length ? list.map(m => '<li><div class="row col"><span class="said">' + esc(m.said) + '</span><span class="right">' + esc(m.correct) + '</span>' +
      '<span class="meta">' + (m.rule ? esc(m.rule) + ' · ' : '') + esc(m.src || '') + ' · ' + esc(fmtShort(m.day)) + (m.cardId ? ' <span class="pill good">In cards</span>' : '') + '</span>' +
      '<span class="btnrow"><button class="linkbtn star" data-a="focus" data-id="' + m.id + '" aria-pressed="' + !!m.focus + '">' + (m.focus ? '★ Focus' : '☆ Focus') + '</button>' +
      (m.cardId ? '' : '<button class="linkbtn" data-a="card" data-id="' + m.id + '">Make a card</button>') +
      '<button class="linkbtn danger" data-a="del" data-id="' + m.id + '">Delete</button></span></div></li>').join('')
      : '<li class="empty">No mistakes yet. After each class or AI chat, save the corrections here.</li>';
  }
  box.innerHTML = header('Mistake log', 'more', 'Every correction becomes a card.') +
    '<form class="card stack" id="f" novalidate><label for="said">What I said</label><input id="said" maxlength="200" placeholder="e.g. I have 24 years.">' +
    '<label for="corr">Correct version</label><input id="corr" maxlength="200" placeholder="e.g. I\'m 24 years old.">' +
    '<label for="rule">Rule (optional)</label><input id="rule" maxlength="200" placeholder="e.g. Age uses be, not have.">' +
    '<label for="src">Source</label><select id="src"><option>Tutor</option><option>AI</option><option>Writing</option><option>Other</option></select>' +
    '<label class="check"><input type="checkbox" id="mk" checked> Make a card too</label>' +
    '<button class="btn primary" type="submit">Save mistake</button></form>' + importerHTML('mistakes') + '<div id="focus"></div><ul class="list" id="list"></ul>';
  box.querySelector('#f').addEventListener('submit', async e => {
    e.preventDefault();
    const said = box.querySelector('#said').value, corr = box.querySelector('#corr').value, rule = box.querySelector('#rule').value, src = box.querySelector('#src').value;
    const m = await addMistake(said, corr, rule, src);
    if (!m) { toast('Fill in what you said and the correct version.'); return; }
    if (box.querySelector('#mk').checked) await mistakeToCard(m);
    ['said', 'corr', 'rule'].forEach(i => { box.querySelector('#' + i).value = ''; });
    box.querySelector('#said').focus();
    toast('Mistake saved.'); draw();
  });
  bindImporter(box, 'AI');
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const m = S.mistakes.find(x => x.id === b.dataset.id);
    if (!m) return;
    if (b.dataset.a === 'focus') {
      if (!m.focus && S.mistakes.filter(x => x.focus).length >= 3) { toast('Keep it to 3. Remove one star first.'); return; }
      m.focus = !m.focus; await dbPut('mistakes', m); draw();
    } else if (b.dataset.a === 'card') { await mistakeToCard(m); toast('Card added.'); draw(); }
    else if (b.dataset.a === 'del' && await ask('Delete this mistake?', 'Delete', true)) { S.mistakes = S.mistakes.filter(x => x.id !== m.id); await dbDel('mistakes', m.id); emit(); draw(); }
  });
  window.addEventListener('eg:data', draw);
  draw();
  return () => window.removeEventListener('eg:data', draw);
}

/* ---------- Grammar ---------- */
function grammarList(box) {
  const gs = S.stats.grammar || {};
  box.innerHTML = header('Grammar', 'more', 'Explanations in Spanish, practice in English.') + '<ul class="list">' +
    GRAMMAR.map((g, i) => { const s = gs[g.id]; return '<li><a class="row" href="#more/grammar/' + g.id + '"><span class="num">' + (i + 1) + '</span><span class="txt"><span class="desc">' + esc(g.title) + '</span><span class="cat">' + (s ? 'Best ' + s.best + '/' + g.q.length : 'Not done yet') + '</span></span>' + (s && s.best === g.q.length ? '<span class="pill good">Done</span>' : '<span class="chev">›</span>') + '</a></li>'; }).join('') + '</ul>';
}

function lesson(box, id) {
  const g = GRAMMAR.find(x => x.id === id);
  if (!g) { box.innerHTML = header('Not found', 'more/grammar'); return; }
  trackStart('grammar');
  const st = { i: -1, right: 0, answered: false, last: null, wrong: [] };
  function draw() {
    if (st.i < 0) {
      box.innerHTML = header(g.title, 'more/grammar') + '<section class="card"><p class="es-exp">' + esc(g.es) + '</p></section>' +
        '<section class="card"><p class="eyebrow">Examples · tap to hear</p><ul class="examples">' + g.ex.map((x, i) => '<li><button class="linkbtn" data-ex="' + i + '">' + esc(x) + '</button></li>').join('') + '</ul></section>' +
        '<button class="btn go wide" data-a="start">Practice (' + g.q.length + ' questions)</button>';
      return;
    }
    if (st.i >= g.q.length) {
      const gs = S.stats.grammar = S.stats.grammar || {};
      const prev = gs[g.id] || { best: 0, done: 0 };
      gs[g.id] = { best: Math.max(prev.best, st.right), done: prev.done + 1, last: todayKey() };
      saveStats();
      box.innerHTML = header(g.title, 'more/grammar') + '<section class="card done-card"><p class="bignum">' + st.right + '/' + g.q.length + '</p><h2>' + (st.right === g.q.length ? 'Perfect!' : 'Good work') + '</h2>' +
        (st.wrong.length ? '<p class="hint">Save the ones you missed as cards so they don\'t come back in your speaking.</p><button class="btn" data-a="savewrong">Save ' + st.wrong.length + ' as cards</button>' : '') +
        '<div class="btnrow center"><button class="btn go" data-a="start">Try again</button><a class="btn" href="#more/grammar">All topics</a></div></section>';
      return;
    }
    const q = g.q[st.i];
    let body;
    if (q.t === 'c') {
      body = '<div class="options col">' + q.o.map((o, i) => {
        const cls = st.answered ? (i === q.a ? ' right' : (st.last === i ? ' wrong' : '')) : '';
        return '<button class="btn opt' + cls + '" data-pick="' + i + '"' + (st.answered ? ' disabled' : '') + '>' + esc(o) + '</button>';
      }).join('') + '</div>';
    } else {
      body = '<input id="gap" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the missing words"' + (st.answered ? ' disabled value="' + esc(st.last || '') + '"' : '') + '>' +
        (st.answered ? '' : '<button class="btn primary" data-a="check">Check</button>');
    }
    const ok = st.answered && (q.t === 'c' ? st.last === q.a : q.a.some(x => sameAnswer(x, st.last || '')));
    box.innerHTML = header(g.title, 'more/grammar', 'Question ' + (st.i + 1) + ' of ' + g.q.length) +
      '<section class="card game"><p class="sentence">' + esc(q.q).replace('___', '<span class="blank">___</span>') + '</p>' + body +
      (st.answered ? '<p class="feedback ' + (ok ? 'ok' : 'bad') + '">' + (ok ? 'Right! ' : 'Answer: <b>' + esc(q.t === 'c' ? q.o[q.a] : q.a[0]) + '</b>. ') + esc(q.why) + '</p><button class="btn go" data-a="next">Next</button>' : '') +
      '</section>';
    const inp = box.querySelector('#gap'); if (inp && !st.answered) inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
  }
  function fullSentence(q) { const ans = q.t === 'c' ? q.o[q.a] : q.a[0]; return q.q.replace(/\s*\(.*?\)\s*$/, '').replace('___', ans === '(nothing)' ? '' : ans).replace(/\s+/g, ' ').trim(); }
  function mark(ok) { st.answered = true; if (ok) st.right++; else st.wrong.push(g.q[st.i]); draw(); }
  function check() { const v = box.querySelector('#gap').value; if (!v.trim()) return; st.last = v; mark(g.q[st.i].a.some(x => sameAnswer(x, v))); }
  box.addEventListener('click', async e => {
    const ex = e.target.closest('[data-ex]');
    if (ex) { say(g.ex[Number(ex.dataset.ex)]); return; }
    const p = e.target.closest('[data-pick]');
    if (p && !st.answered) { st.last = Number(p.dataset.pick); mark(st.last === g.q[st.i].a); return; }
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'start') { st.i = 0; st.right = 0; st.wrong = []; st.answered = false; st.last = null; draw(); }
    else if (a === 'check') check();
    else if (a === 'next') { st.i++; st.answered = false; st.last = null; draw(); }
    else if (a === 'savewrong') {
      for (const q of st.wrong) await addCard({ kind: 'prod', cat: 'user', es: q.q.replace('___', '…'), en: fullSentence(q), note: q.why, src: 'grammar' });
      toast('Saved ' + st.wrong.length + ' cards.'); b.disabled = true;
    }
  });
  draw();
}

/* ---------- Progress ---------- */
function chartWidth(el) { const w = Math.round(el.clientWidth || 0); return w >= 280 ? w : 340; }
function progress(box) {
  function draw() {
    const totalMin = S.log.reduce((a, e) => a + e.min, 0), hours = totalMin / 60, st = streaks();
    const next = MILESTONES.find(m => m > hours) || Math.ceil((hours + 1) / 1000) * 1000;
    const prev = MILESTONES.filter(m => m <= hours).pop() || 0;
    const tk = todayKey(), tn = dayNum(tk), mon = tn - ((dow(tk) + 6) % 7);
    const days = []; for (let i = 0; i < 7; i++) { const k = keyFromNum(mon + i); days.push({ k, t: dayTotals(k) }); }
    const wk = { total: 0, input: 0, output: 0, study: 0 }; days.forEach(d => { ['input', 'output', 'study'].forEach(g => { wk[g] += d.t[g]; }); wk.total += d.t.total; });
    const s0 = dayNum(startKey());
    let nextIdx = CHECKS.findIndex(c => s0 + c.off >= tn);
    const revs = Object.keys(S.revlog).filter(k => dayNum(k) > tn - 30).reduce((a, k) => { a.n += S.revlog[k].n; a.again += S.revlog[k].again; return a; }, { n: 0, again: 0 });
    const learned = S.cards.filter(c => c.state === 'review').length;
    const tests = S.tests.slice().sort((a, b) => a.date < b.date ? -1 : 1);
    box.innerHTML = header('Progress', 'more') +
      '<div class="stats3 card"><div><p class="eyebrow">Total</p><p class="bignum">' + fmtH(totalMin) + '<span class="unit">h</span></p></div><div><p class="eyebrow">Streak</p><p class="bignum">' + st.cur + '<span class="unit">d</span></p></div><div><p class="eyebrow">Best</p><p class="bignum">' + st.best + '<span class="unit">d</span></p></div></div>' +
      '<section><div class="row-between pad"><h2>Next milestone</h2><span class="hint">' + next + ' h · ' + (next - hours >= 10 ? Math.round(next - hours) : (next - hours).toFixed(1)) + ' h to go</span></div><div class="meter big pad-x"><i style="width:' + Math.min(100, (hours - prev) / (next - prev) * 100) + '%"></i></div></section>' +
      '<section class="card"><div class="row-between"><h2>This week</h2><span class="legend">' + GROUPS.map(g => '<span style="--sw:' + g.color + '">' + g.label + '</span>').join('') + '</span></div><div id="wchart" class="chart"></div>' +
      (wk.total ? '<p class="hint">' + fmtH(wk.total) + ' h · Output ' + Math.round(100 * wk.output / wk.total) + '% ' + (wk.output / wk.total >= 0.25 ? '<span class="pill good">On target (25%+)</span>' : '<span class="pill warn">Speak more: target 25%+</span>') + '</p>' : '') + '</section>' +
      '<section class="card"><h2>Hours per week</h2><div id="tchart" class="chart"></div></section>' +
      '<section class="card"><h2>Cards</h2><p>' + learned + ' learned of ' + S.cards.length + ' · ' + revs.n + ' answers in 30 days' + (revs.n ? ' · ' + Math.round(100 * (revs.n - revs.again) / revs.n) + '% remembered' : '') + '</p></section>' +
      '<section><h2 class="sec">Checkpoints</h2><ul class="list">' + CHECKS.map((c, i) => { const n = s0 + c.off, past = n < tn, isNext = i === nextIdx;
        return '<li><div class="row"><span class="diamond' + (past ? ' past' : isNext ? ' next' : '') + '"></span><span class="txt"><span class="cat">' + esc(c.label) + ' · ' + esc(fmtLong(keyFromNum(n))) + '</span><span class="desc">' + esc(c.goal) + '</span></span>' +
        (past ? '<span class="pill">Past</span>' : isNext ? '<span class="pill next">' + (n === tn ? 'Today' : 'In ' + (n - tn) + ' d') + '</span>' : '') + '</div></li>'; }).join('') + '</ul></section>' +
      '<section><h2 class="sec">EF SET results</h2><ul class="list">' + (tests.length ? tests.map((t, i) => '<li><div class="row"><span class="time">' + esc(fmtShort(t.date)) + '</span><span class="txt"><b>' + t.score + '/100</b> · ' + band(t.score) + (i ? ' <span class="hint">(' + (t.score - tests[0].score >= 0 ? '+' : '') + (t.score - tests[0].score) + ' since first)</span>' : '') + '</span><button class="iconbtn" data-del="' + t.id + '" aria-label="Delete result">×</button></div></li>').join('') : '<li class="empty">No results yet. Take the EF SET at efset.org and add your score.</li>') + '</ul>' +
      '<form class="card formrow" id="tf" novalidate><label for="td">Date</label><label for="ts">Score, 0–100</label><input id="td" type="date" value="' + tk + '"><input id="ts" type="number" inputmode="numeric" min="0" max="100"><button class="btn" type="submit">Add</button></form></section>';
    drawWeek(box.querySelector('#wchart'), days);
    drawTrend(box.querySelector('#tchart'), mon);
  }
  function band(s) { return s <= 20 ? 'A0' : s <= 30 ? 'A1' : s <= 40 ? 'A2' : s <= 50 ? 'B1' : s <= 60 ? 'B2' : s <= 70 ? 'C1' : 'C2'; }
  box.addEventListener('submit', async e => {
    if (e.target.id !== 'tf') return;
    e.preventDefault();
    const date = box.querySelector('#td').value, score = Math.round(Number(box.querySelector('#ts').value));
    if (!validKey(date) || box.querySelector('#ts').value === '' || !(score >= 0 && score <= 100)) { toast('Pick a date and a score from 0 to 100.'); return; }
    const t = { id: uid('t'), date, score, kind: 'EF SET' };
    S.tests.push(t); await dbPut('tests', t); toast('Result saved: ' + score + ' (' + band(score) + ').'); draw();
  });
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-del]');
    if (b && await ask('Delete this result?', 'Delete', true)) { S.tests = S.tests.filter(t => t.id !== b.dataset.del); await dbDel('tests', b.dataset.del); draw(); }
  });
  draw();
}

function drawWeek(el, days) {
  if (!days.some(d => d.t.total)) { el.innerHTML = '<p class="empty">No practice this week yet.</p>'; return; }
  const W = chartWidth(el), H = 200, base = 165, top = 26, bw = W / 7, L = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(60, ...days.map(d => d.t.total)), tk = todayKey();
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Minutes per day this week"><line x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '" stroke="var(--rule-2)"/>';
  days.forEach((d, i) => {
    const w = bw * 0.56, x = i * bw + (bw - w) / 2; let y = base;
    GROUPS.forEach(g => { const v = d.t[g.id]; if (v > 0) { const h = v / max * (base - top); y -= h; s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + g.color + '"/>'; } });
    if (d.t.total) s += '<text class="v" x="' + (x + w / 2).toFixed(1) + '" y="' + (y - 7).toFixed(1) + '" text-anchor="middle">' + d.t.total + '</text>';
    s += '<text class="d' + (d.k === tk ? ' now' : '') + '" x="' + (x + w / 2).toFixed(1) + '" y="' + (base + 22) + '" text-anchor="middle">' + L[i] + '</text>';
  });
  el.innerHTML = s + '</svg>';
}
function drawTrend(el, mon) {
  const weeks = [];
  for (let i = 0; i < 8; i++) { const st = mon - 7 * (7 - i); let m = 0; for (let j = 0; j < 7; j++) m += dayTotals(keyFromNum(st + j)).total; weeks.push({ st, m, cur: i === 7 }); }
  if (!weeks.some(w => w.m)) { el.innerHTML = '<p class="empty">Weekly hours appear after your first week.</p>'; return; }
  const W = chartWidth(el), H = 190, base = 155, top = 26, bw = W / 8, max = Math.max(60, ...weeks.map(w => w.m));
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Hours per week, last 8 weeks"><line x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '" stroke="var(--rule-2)"/>';
  weeks.forEach((w, i) => {
    const bwid = bw * 0.56, x = i * bw + (bw - bwid) / 2, h = w.m / max * (base - top), y = base - h;
    if (w.m) s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bwid.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + (w.cur ? 'var(--ink)' : 'var(--study)') + '"/><text class="v" x="' + (x + bwid / 2).toFixed(1) + '" y="' + (y - 7).toFixed(1) + '" text-anchor="middle">' + fmtH(w.m) + '</text>';
    s += '<text class="d' + (w.cur ? ' now' : '') + '" x="' + (x + bwid / 2).toFixed(1) + '" y="' + (base + 22) + '" text-anchor="middle">' + fmtShort(keyFromNum(w.st)).replace(' ', ' ') + '</text>';
  });
  el.innerHTML = s + '</svg>';
}

/* ---------- Guide ---------- */
function guide(box) {
  box.innerHTML = header('Your plan', 'more') +
    GUIDE.map(g => '<section class="card"><h2>' + esc(g.title) + '</h2>' + g.body.split('\n').map(p => '<p>' + esc(p) + '</p>').join('') + '</section>').join('') +
    '<section class="card"><h2>Prompts to copy</h2><p class="hint">Use them in any AI app.</p><ul class="list">' +
    AI_SCENARIOS.map(s => '<li><div class="row"><span class="txt"><span class="desc">' + esc(s.title) + '</span></span><button class="btn small" data-copy="' + s.id + '">Copy</button></div></li>').join('') +
    '<li><div class="row"><span class="txt"><span class="desc">Writing coach</span></span><button class="btn small" data-copy="write">Copy</button></div></li></ul></section>' +
    '<p class="pad"><a class="btn wide" href="' + PLAN_DOC_URL + '" target="_blank" rel="noopener">Open the full plan (needs internet)</a></p>';
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const s = AI_SCENARIOS.find(x => x.id === b.dataset.copy);
    const text = s ? s.prompt.replace(/\{TOPIC\}/g, 'my topic') : WRITE_PROMPT.replace('{TEXT}', '');
    toast(await copyText(text) ? 'Prompt copied.' : 'Could not copy.');
  });
}

/* ---------- Settings and backup ---------- */
function settings(box) {
  const vs = enVoices();
  const cur = S.settings;
  box.innerHTML = header('Settings', 'more', 'English Gym ' + APP_VERSION) +
    '<form class="card stack" id="f" novalidate>' +
    '<label for="sd">Start date (Week 1, Day 1)</label><input id="sd" type="date" value="' + esc(cur.startDate) + '">' +
    '<fieldset><legend>How do you get to work?</legend><label class="check"><input type="radio" name="cm" value="car"' + (cur.commute !== 'transit' ? ' checked' : '') + '> I drive</label><label class="check"><input type="radio" name="cm" value="transit"' + (cur.commute === 'transit' ? ' checked' : '') + '> Public transport</label></fieldset>' +
    '<label for="np">New cards per day</label><input id="np" type="number" inputmode="numeric" min="0" max="50" value="' + cur.newPerDay + '">' +
    '<label for="vc">Voice</label><select id="vc">' + (vs.length ? vs.map(v => '<option value="' + esc(v.voiceURI) + '"' + (v.voiceURI === cur.voiceURI ? ' selected' : '') + '>' + esc(v.name + ' · ' + accentOf(v)) + '</option>').join('') : '<option value="">Default English voice</option>') + '</select>' +
    '<label for="rt">Speed: <span id="rtv">' + cur.rate + '</span>×</label><input id="rt" type="range" min="0.6" max="1.2" step="0.05" value="' + cur.rate + '">' +
    '<button class="btn" type="button" data-a="test">Test voice</button>' +
    '<label class="check"><input type="checkbox" id="ap"' + (cur.autoplay ? ' checked' : '') + '> Play the answer when I flip a card</label>' +
    '<fieldset><legend>AI app</legend><label class="check"><input type="radio" name="ai" value="claude"' + (cur.ai !== 'gemini' ? ' checked' : '') + '> Claude</label><label class="check"><input type="radio" name="ai" value="gemini"' + (cur.ai === 'gemini' ? ' checked' : '') + '> Gemini</label></fieldset>' +
    '<button class="btn primary" type="submit">Save settings</button></form>' +
    '<section class="card"><h2>Backup</h2><p class="hint">Your data lives only on this iPhone. Make a backup every week and keep it in Files or iCloud Drive. Recordings are not included.</p>' +
    '<div class="btnrow"><button class="btn primary" data-a="export">Save backup</button><label class="btn" for="imp">Restore backup</label><input id="imp" type="file" accept="application/json,.json" hidden></div>' +
    '<p class="hint" id="pers"></p></section>' +
    '<section class="card"><h2>App</h2><div class="btnrow"><button class="btn" data-a="update">Check for updates</button><button class="btn danger" data-a="reset">Erase everything</button></div></section>';
  if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const el = box.querySelector('#pers'); if (el) el.textContent = p ? 'Storage is protected on this device.' : 'Tip: keep the app on your Home Screen so iOS keeps your data.'; });
  box.querySelector('#rt').addEventListener('input', e => { box.querySelector('#rtv').textContent = e.target.value; });
  box.querySelector('#f').addEventListener('submit', async e => {
    e.preventDefault();
    const sd = box.querySelector('#sd').value;
    if (!validKey(sd)) { toast('Pick a start date.'); return; }
    Object.assign(S.settings, {
      startDate: sd, commute: box.querySelector('input[name="cm"]:checked').value,
      newPerDay: Math.max(0, Math.min(50, Math.round(Number(box.querySelector('#np').value) || 0))),
      voiceURI: box.querySelector('#vc').value, rate: Number(box.querySelector('#rt').value),
      autoplay: box.querySelector('#ap').checked, ai: box.querySelector('input[name="ai"]:checked').value
    });
    await saveSettings(); emit(); toast('Settings saved.');
  });
  box.querySelector('#imp').addEventListener('change', e => { const f = e.target.files[0]; if (f) restore(f); e.target.value = ''; });
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'test') speak('Hi Alain! This is how I sound. Let\'s practice your English today.', { voice: vs.find(v => v.voiceURI === box.querySelector('#vc').value), rate: Number(box.querySelector('#rt').value) });
    else if (a === 'export') exportData();
    else if (a === 'update') { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) { await reg.update(); toast(reg.waiting || reg.installing ? 'Update found. Reloading…' : 'You have the latest version.'); if (reg.waiting) { reg.waiting.postMessage('skipWaiting'); setTimeout(() => location.reload(), 900); } } else toast('Updates work once the app is installed.'); }
    else if (a === 'reset' && await ask('Erase all your data from this iPhone? Make a backup first.', 'Erase everything', true)) { for (const s of ALL_STORES) await dbClear(s); location.reload(); }
  });
}

async function exportData() {
  const data = { app: 'english-gym', format: 1, exported: new Date().toISOString(), settings: S.settings, log: S.log, cards: S.cards, phrases: S.phrases, mistakes: S.mistakes, tests: S.tests, revlog: S.revlog, stats: S.stats, custom: S.custom };
  const name = 'english-gym-backup-' + todayKey() + '.json';
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); await setKV('lastBackup', Date.now()); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function restore(file) {
  let d;
  try { d = JSON.parse(await file.text()); } catch (e) { toast('That file is not a backup.'); return; }
  if (!d || d.app !== 'english-gym') { toast('That file is not an English Gym backup.'); return; }
  if (!await ask('Replace the data on this iPhone with the backup from ' + String(d.exported || '').slice(0, 10) + '?', 'Restore', true)) return;
  for (const s of ['log', 'cards', 'phrases', 'mistakes', 'tests']) { await dbClear(s); if (Array.isArray(d[s])) await dbPutMany(s, d[s]); }
  await setKV('settings', Object.assign({}, DEFAULTS, d.settings || {}));
  await setKV('revlog', d.revlog || {}); await setKV('stats', d.stats || {}); await setKV('custom', d.custom || []);
  toast('Backup restored.');
  setTimeout(() => location.reload(), 600);
}
