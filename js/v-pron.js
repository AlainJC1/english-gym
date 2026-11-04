import { S, esc, header, say, stopSpeaking, trackStart, trackPing, toast, saveStats, setKV, uid, ask } from './core.js';
import { enVoices, accentOf, Recorder, playBlob, stopPlayback, speak, micErrorText } from './audio.js';
import { compareWords, sameAnswer } from './text.js';
import { SHADOW, splitSentences } from '../data/shadow.js';
import { CONTRASTS, ED_GAME, STRESS, SAY_SETS } from '../data/sounds.js';
import { micHint } from './ui.js';

export function renderPron(box, params) {
  const [sub, id] = params;
  if (sub === 'shadow' && id === 'new') return customForm(box);
  if (sub === 'shadow' && id) return shadow(box, id);
  if (sub === 'pairs' && id) return pairs(box, id);
  if (sub === 'ed') return pairs(box, 'ed');
  if (sub === 'stress') return stress(box);
  if (sub === 'say' && id) return sayIt(box, id);
  return home(box);
}

function stat(id) { const s = S.stats[id]; return s ? 'Best ' + s.best + '% · ' + s.played + ' rounds' : 'Not played yet'; }

function home(box) {
  const texts = SHADOW.concat(S.custom || []);
  box.innerHTML = header('Pronounce', null, 'Ear first, then mouth.') +
    '<h2 class="sec">Shadowing</h2><ul class="list">' +
    texts.map(t => '<li><a class="row" href="#pron/shadow/' + esc(t.id) + '"><span class="txt"><span class="desc">' + esc(t.title) + '</span><span class="cat">' + esc(t.level || 'Your text') + ' · ' + splitSentences(t.text).length + ' sentences</span></span><span class="chev">›</span></a></li>').join('') +
    '<li><a class="row" href="#pron/shadow/new"><span class="txt"><span class="desc">Add your own text</span><span class="cat">Paste a podcast transcript or a script</span></span><span class="chev">›</span></a></li></ul>' +
    '<h2 class="sec">Train your ear</h2><p class="hint pad">Listen and choose what you heard. Different voices make your ear stronger.</p><ul class="list">' +
    CONTRASTS.map(c => '<li><a class="row" href="#pron/pairs/' + c.id + '"><span class="txt"><span class="desc">' + esc(c.title) + '</span><span class="cat">' + esc(c.labels.join(' · ')) + ' — ' + stat(c.id) + '</span></span><span class="chev">›</span></a></li>').join('') +
    '<li><a class="row" href="#pron/ed"><span class="txt"><span class="desc">' + esc(ED_GAME.title) + '</span><span class="cat">/t/ · /d/ · /ɪd/ — ' + stat('ed') + '</span></span><span class="chev">›</span></a></li>' +
    '<li><a class="row" href="#pron/stress"><span class="txt"><span class="desc">Word stress</span><span class="cat">Which syllable is strong? — ' + stat('stress') + '</span></span><span class="chev">›</span></a></li></ul>' +
    '<h2 class="sec">Say it</h2><p class="hint pad">Say the word with iPhone dictation and see if it understood you.</p><ul class="list">' +
    SAY_SETS.map(s => '<li><a class="row" href="#pron/say/' + s.id + '"><span class="txt"><span class="desc">' + esc(s.title) + '</span><span class="cat">' + stat('say-' + s.id) + '</span></span><span class="chev">›</span></a></li>').join('') + '</ul>' +
    voiceNote();
}

function voiceNote() {
  const n = enVoices().length;
  return '<p class="hint pad">' + n + ' English voice' + (n === 1 ? '' : 's') + ' on this iPhone. For better voices and more accents: Settings › Accessibility › Spoken Content › Voices › English, and download "Enhanced" voices.</p>';
}

/* ---------- Shadowing ---------- */
function customForm(box) {
  box.innerHTML = header('Your text', 'pron') +
    '<form class="card stack" id="f" novalidate><label for="tt">Title</label><input id="tt" maxlength="60" placeholder="e.g. 6 Minute English: sleep">' +
    '<label for="tx">Text</label><textarea id="tx" rows="8" placeholder="Paste a short transcript (5–15 sentences)"></textarea>' +
    '<button class="btn primary" type="submit">Save text</button></form>' +
    ((S.custom || []).length ? '<h2 class="sec">Your texts</h2><ul class="list">' + S.custom.map(t => '<li><div class="row"><span class="txt"><span class="desc">' + esc(t.title) + '</span></span><button class="linkbtn danger" data-del="' + t.id + '">Delete</button></div></li>').join('') + '</ul>' : '');
  box.querySelector('#f').addEventListener('submit', async e => {
    e.preventDefault();
    const title = box.querySelector('#tt').value.trim() || 'My text', text = box.querySelector('#tx').value.trim();
    if (splitSentences(text).length < 1) { toast('Paste some text first.'); return; }
    const t = { id: uid('t'), title, text, level: 'Your text' };
    S.custom = (S.custom || []).concat(t);
    await setKV('custom', S.custom);
    location.hash = 'pron/shadow/' + t.id;
  });
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-del]');
    if (!b || !await ask('Delete this text?', 'Delete', true)) return;
    S.custom = S.custom.filter(t => t.id !== b.dataset.del);
    await setKV('custom', S.custom);
    customForm(box);
  });
}

function shadow(box, id) {
  const t = SHADOW.concat(S.custom || []).find(x => x.id === id);
  if (!t) { box.innerHTML = header('Not found', 'pron'); return; }
  trackStart('pron');
  const sents = splitSentences(t.text);
  const st = { i: 0, rate: 1, mine: {}, echo: false, rec: null };
  function draw() {
    const s = sents[st.i];
    box.innerHTML = header(t.title, 'pron', (st.i + 1) + ' of ' + sents.length) +
      '<section class="card shadow-card"><p class="sentence">' + esc(s) + '</p>' +
      '<div class="btnrow center"><button class="btn primary" data-a="play">Play</button><button class="btn" data-a="loop">Play ×3</button>' +
      '<button class="btn" data-a="speed">Speed ' + st.rate + '×</button></div>' +
      '<div class="btnrow center"><button class="btn ' + (st.rec ? 'rec' : '') + '" data-a="rec">' + (st.rec ? 'Stop recording' : 'Record me') + '</button>' +
      '<button class="btn" data-a="me"' + (st.mine[st.i] ? '' : ' disabled') + '>Play me</button><button class="btn" data-a="cmp"' + (st.mine[st.i] ? '' : ' disabled') + '>Me, then model</button></div>' +
      '<div class="btnrow center nav"><button class="btn ghost" data-a="prev"' + (st.i ? '' : ' disabled') + '>‹ Previous</button><button class="btn ghost" data-a="next"' + (st.i < sents.length - 1 ? '' : ' disabled') + '>Next ›</button></div></section>' +
      '<section class="card"><h2>Echo mode</h2><p class="hint">Plays every sentence and leaves time for you to repeat it out loud. Good for the car.</p>' +
      '<button class="btn ' + (st.echo ? 'rec' : 'go') + '" data-a="echo">' + (st.echo ? 'Stop echo mode' : 'Start echo mode') + '</button></section>' +
      '<section class="card"><h2>Check with dictation</h2>' + micHint() + '<textarea id="dict" rows="3" placeholder="Read the sentence with dictation"></textarea>' +
      '<button class="btn" data-a="check">Check</button><div id="dres" aria-live="polite"></div></section>' +
      '<details class="card"><summary>Full text</summary><p class="fulltext">' + sents.map((x, i) => '<span class="' + (i === st.i ? 'cur' : '') + '" data-go="' + i + '">' + esc(x) + '</span>').join(' ') + '</p></details>';
  }
  async function playLoop(n) { for (let k = 0; k < n; k++) { const ok = await say(sents[st.i], { rate: st.rate }); if (!ok) break; await wait(700); } }
  async function echo() {
    st.echo = true; draw();
    while (st.echo && st.i < sents.length) {
      const t0 = Date.now();
      const ok = await say(sents[st.i], { rate: st.rate });
      if (!st.echo || !ok) break;
      await wait(Math.max(1500, (Date.now() - t0) * 1.2));
      if (!st.echo) break;
      if (st.i >= sents.length - 1) break;
      st.i++; draw();
    }
    st.echo = false; draw();
  }
  box.addEventListener('click', async e => {
    const g = e.target.closest('[data-go]');
    if (g) { st.i = Number(g.dataset.go); stopSpeaking(); draw(); return; }
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    const a = b.dataset.a;
    if (a === 'play') say(sents[st.i], { rate: st.rate });
    else if (a === 'loop') playLoop(3);
    else if (a === 'speed') { st.rate = st.rate === 1 ? 0.75 : st.rate === 0.75 ? 0.9 : st.rate === 0.9 ? 1.1 : 1; draw(); }
    else if (a === 'prev' || a === 'next') { st.echo = false; stopSpeaking(); st.i += a === 'next' ? 1 : -1; box.querySelector('#dict') && (box.querySelector('#dict').value = ''); draw(); }
    else if (a === 'echo') { if (st.echo) { st.echo = false; stopSpeaking(); draw(); } else echo(); }
    else if (a === 'rec') {
      if (st.rec) { const r = await st.rec.stop(); st.rec = null; if (r) { st.mine[st.i] = r.blob; playBlob(r.blob); } else toast('Nothing was recorded. Try again and speak for at least a second.'); trackPing(); draw(); }
      else { stopSpeaking(); st.rec = new Recorder(); try { await st.rec.start(); draw(); } catch (err) { st.rec = null; toast(micErrorText(err)); } }
    }
    else if (a === 'me') playBlob(st.mine[st.i]);
    else if (a === 'cmp') { await playBlob(st.mine[st.i]); await wait(400); say(sents[st.i], { rate: st.rate }); }
    else if (a === 'check') {
      const r = compareWords(sents[st.i], box.querySelector('#dict').value);
      box.querySelector('#dres').innerHTML = '<p class="diff">' + r.marks.map(m => '<span class="' + (m.ok ? 'ok' : 'miss') + '">' + esc(m.w) + '</span>').join(' ') + '</p>' +
        '<p class="hint">' + Math.round(r.score * 100) + '% understood. Red words: practice them with Play and slow speed.</p>';
      trackPing();
    }
  });
  draw();
  return () => { st.echo = false; stopSpeaking(); stopPlayback(); if (st.rec) st.rec.cancel(); };
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ---------- Ear games ---------- */
function voicePool() {
  const vs = enVoices();
  const byLang = {};
  vs.forEach(v => { (byLang[v.lang] = byLang[v.lang] || []).push(v); });
  return vs.length ? vs : [null];
}
function randomVoice(pool) {
  const v = pool[Math.floor(Math.random() * pool.length)];
  return { voice: v, rate: 0.85 + Math.random() * 0.2, pitch: pool.length < 3 ? 0.85 + Math.random() * 0.3 : 1 };
}
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function saveScore(id, right, total) {
  const s = S.stats[id] || { played: 0, best: 0, last: 0 };
  const pct = Math.round(100 * right / total);
  s.played += total; s.last = pct; s.best = Math.max(s.best, pct);
  S.stats[id] = s; saveStats();
  return pct;
}

function pairs(box, id) {
  const isEd = id === 'ed';
  const c = isEd ? ED_GAME : CONTRASTS.find(x => x.id === id);
  if (!c) { box.innerHTML = header('Not found', 'pron'); return; }
  trackStart('pron');
  const pool = voicePool();
  const ROUNDS = 12;
  const st = { n: 0, right: 0, round: null, answered: false, wrongs: [] };
  function newRound() {
    let options, answer, word;
    if (isEd) {
      const w = c.words[Math.floor(Math.random() * c.words.length)];
      word = w[0]; answer = w[1]; options = c.labels;
    } else {
      const item = c.items[Math.floor(Math.random() * c.items.length)];
      answer = Math.floor(Math.random() * item.length); word = item[answer]; options = item;
    }
    st.round = { word, answer, options, v: randomVoice(pool) };
    st.answered = false;
  }
  function play() { const r = st.round; trackPing(); return speak(r.word, { voice: r.v.voice, rate: r.v.rate, pitch: r.v.pitch }); }
  function draw(feedback) {
    if (st.n >= ROUNDS) {
      const pct = saveScore(id, st.right, ROUNDS);
      box.innerHTML = header(c.title, 'pron') + '<section class="card done-card"><p class="bignum">' + pct + '%</p><h2>' + st.right + ' of ' + ROUNDS + ' right</h2>' +
        '<p class="hint">' + (pct >= 90 ? 'Excellent. Your ear hears this contrast. Now practice saying it in Say it.' : pct >= 70 ? 'Good. Play again tomorrow; it improves with different voices.' : 'This contrast is hard for Spanish speakers. Play a round every day this week.') + '</p>' +
        (st.wrongs.length ? '<p class="hint">Missed: ' + esc(st.wrongs.join(', ')) + '</p>' : '') +
        '<div class="btnrow center"><button class="btn go" data-a="again">Play again</button><a class="btn" href="#pron">Done</a></div></section>';
      return;
    }
    const r = st.round;
    const vName = r.v.voice ? accentOf(r.v.voice) + ' voice' : 'Voice';
    box.innerHTML = header(c.title, 'pron', 'Round ' + (st.n + 1) + ' of ' + ROUNDS + ' · ' + st.right + ' right') +
      '<section class="card game"><p class="hint">' + esc(c.tip) + '</p>' +
      '<button class="btn big-play" data-a="play" aria-label="Play the word">▶︎</button><p class="hint center">' + esc(vName) + '</p>' +
      '<div class="options">' + r.options.map((o, i) => {
        const cls = st.answered ? (i === r.answer ? ' right' : (feedback && feedback.pick === i ? ' wrong' : '')) : '';
        return '<button class="btn opt' + cls + '" data-pick="' + i + '"' + (st.answered ? ' disabled' : '') + '>' + esc(o) + (isEd ? '' : '<small>' + esc(c.labels[i] || '') + '</small>') + '</button>';
      }).join('') + '</div>' +
      (st.answered ? '<p class="feedback ' + (feedback.ok ? 'ok' : 'bad') + '">' + (feedback.ok ? 'Right!' : 'It was "' + esc(isEd ? r.word + '" → ' + c.labels[r.answer] : r.options[r.answer] + '"')) + '</p>' +
        '<div class="btnrow center">' + (isEd ? '<button class="btn" data-a="play">Hear it again</button>' : '<button class="btn" data-a="both">Hear all</button>') + '<button class="btn go" data-a="next">Next</button></div>' : '') +
      '</section>';
  }
  box.addEventListener('click', async e => {
    const p = e.target.closest('[data-pick]');
    if (p && !p.disabled && !st.answered) {
      const pick = Number(p.dataset.pick), ok = pick === st.round.answer;
      st.answered = true; if (ok) st.right++; else st.wrongs.push(st.round.word);
      draw({ ok, pick });
      return;
    }
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'play') play();
    else if (a === 'both') { const r = st.round; for (const w of r.options) { await speak(w, { voice: r.v.voice, rate: r.v.rate, pitch: r.v.pitch }); await wait(350); } }
    else if (a === 'next') { st.n++; if (st.n < ROUNDS) { newRound(); draw(); play(); } else draw(); }
    else if (a === 'again') { st.n = 0; st.right = 0; st.wrongs = []; newRound(); draw(); play(); }
  });
  newRound(); draw();
  return () => stopSpeaking();
}

function stress(box) {
  trackStart('pron');
  const ROUNDS = 10;
  let words = shuffle(STRESS).slice(0, ROUNDS);
  const st = { n: 0, right: 0, answered: false, fb: null };
  function draw() {
    if (st.n >= ROUNDS) {
      const pct = saveScore('stress', st.right, ROUNDS);
      box.innerHTML = header('Word stress', 'pron') + '<section class="card done-card"><p class="bignum">' + pct + '%</p><h2>' + st.right + ' of ' + ROUNDS + ' right</h2><p class="hint">Say each word with a strong syllable and the rest short and weak.</p><div class="btnrow center"><button class="btn go" data-a="restart">Play again</button><a class="btn" href="#pron">Done</a></div></section>';
      return;
    }
    const [w, syl, idx] = words[st.n];
    box.innerHTML = header('Word stress', 'pron', 'Round ' + (st.n + 1) + ' of ' + ROUNDS) +
      '<section class="card game"><p class="hint">Listen and tap the STRONG syllable.</p><p class="sentence center">' + esc(w) + '</p>' +
      '<button class="btn big-play" data-a="play" aria-label="Play the word">▶︎</button>' +
      '<div class="options syl">' + syl.map((s, i) => '<button class="btn opt' + (st.answered ? (i === idx ? ' right' : (st.fb === i ? ' wrong' : '')) : '') + '" data-pick="' + i + '"' + (st.answered ? ' disabled' : '') + '>' + esc(s) + '</button>').join('') + '</div>' +
      (st.answered ? '<p class="feedback ' + (st.fb === idx ? 'ok' : 'bad') + '">' + syl.map((s, i) => i === idx ? s.toUpperCase() : s).join('·') + '</p><div class="btnrow center"><button class="btn" data-a="play">Hear it again</button><button class="btn go" data-a="next">Next</button></div>' : '') +
      '</section>';
  }
  box.addEventListener('click', e => {
    const p = e.target.closest('[data-pick]');
    if (p && !st.answered) { st.fb = Number(p.dataset.pick); st.answered = true; if (st.fb === words[st.n][2]) st.right++; draw(); return; }
    const b = e.target.closest('[data-a]');
    if (!b) return;
    if (b.dataset.a === 'play') say(words[st.n][0], { rate: 0.9 });
    else if (b.dataset.a === 'next') { st.n++; st.answered = false; st.fb = null; draw(); if (st.n < ROUNDS) say(words[st.n][0], { rate: 0.9 }); }
    else if (b.dataset.a === 'restart') { words = shuffle(STRESS).slice(0, ROUNDS); st.n = 0; st.right = 0; st.answered = false; st.fb = null; draw(); say(words[0][0], { rate: 0.9 }); }
  });
  draw();
  return () => stopSpeaking();
}

function sayIt(box, id) {
  const set = SAY_SETS.find(s => s.id === id);
  if (!set) { box.innerHTML = header('Not found', 'pron'); return; }
  trackStart('pron');
  const words = shuffle(set.words);
  const st = { n: 0, right: 0, tries: 0, result: null };
  function draw() {
    if (st.n >= words.length) {
      const pct = saveScore('say-' + id, st.right, words.length);
      box.innerHTML = header(set.title, 'pron') + '<section class="card done-card"><p class="bignum">' + pct + '%</p><h2>' + st.right + ' of ' + words.length + ' understood</h2><div class="btnrow center"><button class="btn go" data-a="again">Again</button><a class="btn" href="#pron">Done</a></div></section>';
      return;
    }
    const w = words[st.n];
    box.innerHTML = header(set.title, 'pron', (st.n + 1) + ' of ' + words.length) +
      '<section class="card game"><p class="hint">' + esc(set.tip) + '</p><p class="sentence center">' + esc(w) + '</p>' +
      '<div class="btnrow center"><button class="btn" data-a="model">Hear it</button></div>' + micHint() +
      '<textarea id="d" rows="2" placeholder="Say it with dictation"></textarea>' +
      '<div class="btnrow"><button class="btn primary" data-a="check">Check</button><button class="btn ghost" data-a="skip">Skip</button></div>' +
      (st.result ? '<p class="feedback ' + (st.result.ok ? 'ok' : 'bad') + '">' + (st.result.ok ? 'The iPhone understood you!' : 'It heard: "' + esc(st.result.heard || '…') + '". Listen and try again.') + '</p>' + (st.result.ok ? '<button class="btn go" data-a="next">Next</button>' : '') : '') +
      '</section>';
    const ta = box.querySelector('#d'); if (ta && !st.result) ta.focus({ preventScroll: true });
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a, w = words[st.n];
    if (a === 'model') say(w, { rate: 0.85 });
    else if (a === 'check') {
      const heard = box.querySelector('#d').value;
      const ok = sameAnswer(w, heard) || compareWords(w, heard).score === 1;
      st.tries++;
      if (ok && st.tries === 1) st.right++;
      st.result = { ok, heard };
      draw();
    }
    else if (a === 'skip' || a === 'next') { st.n++; st.tries = 0; st.result = null; draw(); }
    else if (a === 'again') { st.n = 0; st.right = 0; st.tries = 0; st.result = null; draw(); }
  });
  draw();
  return () => stopSpeaking();
}
