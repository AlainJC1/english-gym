import { S, esc, header, addLog, toast, ask, uid, todayKey, fmtShort, fmtTime, topicNow, trackStart, trackStop } from './core.js';
import { Recorder, playBlob, stopPlayback, fmtClock, micErrorText } from './audio.js';
import { dbAll, dbPut, dbDel } from './db.js';
import { AI_SCENARIOS, WRITE_PROMPT, SAMPLE_PROMPT, SAMPLE_QUESTIONS, DIARY_PROMPTS } from '../data/content.js';
import { aiButtons, bindAI, importerHTML, bindImporter, micHint } from './ui.js';

export function renderSpeak(box, params) {
  const [sub, id] = params;
  if (sub === 'chat' && id) return chat(box, id);
  if (sub === 'write') return write(box);
  if (sub === '432') return fourThreeTwo(box);
  if (sub === 'diary') return diary(box);
  if (sub === 'sample') return sample(box);
  if (sub === 'recs') return recs(box);
  return home(box);
}

function home(box) {
  box.innerHTML = header('Speak', null, 'If you can only do one thing today, speak.') +
    '<h2 class="sec">Talk with AI</h2><p class="hint pad">Opens Claude or Gemini with the right instructions. Use their voice mode and say "feedback" at the end.</p><ul class="list">' +
    AI_SCENARIOS.map(s => '<li><a class="row" href="#speak/chat/' + s.id + '"><span class="txt"><span class="desc">' + esc(s.title) + '</span><span class="cat">' + esc(s.desc) + '</span></span><span class="chev">›</span></a></li>').join('') +
    '<li><a class="row" href="#speak/write"><span class="txt"><span class="desc">Writing coach</span><span class="cat">Write 250 words and get them corrected</span></span><span class="chev">›</span></a></li></ul>' +
    '<h2 class="sec">Speak on your own</h2><ul class="list">' +
    '<li><a class="row" href="#speak/432"><span class="txt"><span class="desc">4/3/2 fluency</span><span class="cat">Same story in 4, 3 and 2 minutes</span></span><span class="chev">›</span></a></li>' +
    '<li><a class="row" href="#speak/diary"><span class="txt"><span class="desc">Voice diary</span><span class="cat">Tell your day out loud, up to 5 minutes</span></span><span class="chev">›</span></a></li>' +
    '<li><a class="row" href="#speak/sample"><span class="txt"><span class="desc">Monthly sample</span><span class="cat">Your 3-minute progress recording</span></span><span class="chev">›</span></a></li>' +
    '<li><a class="row" href="#speak/recs"><span class="txt"><span class="desc">Your recordings</span><span class="cat">Listen, share or delete</span></span><span class="chev">›</span></a></li></ul>';
}

function logButtons(cat) {
  return '<div class="card"><p class="eyebrow">When you finish, log the time</p><div class="btnrow">' +
    [10, 15, 20, 30].map(m => '<button class="btn small" data-log="' + m + '" data-cat="' + cat + '">+' + m + ' min</button>').join('') + '</div></div>';
}
function bindLog(box) {
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-log]');
    if (!b) return;
    const r = await addLog(b.dataset.cat, Number(b.dataset.log), 'ai');
    if (r) toast('Logged ' + r.min + ' min.');
  });
}

function chat(box, id) {
  const sc = AI_SCENARIOS.find(s => s.id === id);
  if (!sc) { box.innerHTML = header('Not found', 'speak'); return; }
  box.innerHTML = header(sc.title, 'speak', sc.desc) +
    (sc.usesTopic ? '<section class="card stack"><label for="topic">Topic</label><input id="topic" maxlength="140" value="' + esc(topicNow()) + '"></section>' : '') +
    '<section class="card"><ol class="steps"><li>Tap Open in Claude. The instructions are already written in.</li><li>Send them, then switch to voice mode and talk.</li><li>At the end, say "feedback".</li><li>Copy the whole answer and paste it below to save your mistakes and phrases.</li></ol>' +
    aiButtons('go') + '</section>' + importerHTML(id) + logButtons(id === '432' ? 'speak' : 'speak');
  bindAI(box, () => {
    const t = box.querySelector('#topic');
    return sc.prompt.replace(/\{TOPIC\}/g, t && t.value.trim() ? t.value.trim() : topicNow());
  });
  bindImporter(box, 'AI');
  bindLog(box);
}

function write(box) {
  trackStart('write');
  let draft = '';
  try { draft = localStorage.getItem('eg.draft') || ''; } catch (e) { /* ignore */ }
  box.innerHTML = header('Writing coach', 'speak', 'Write first, without a translator. Then get it corrected.') +
    '<section class="card stack"><label for="tx">Your text (about 250 words)</label><textarea id="tx" rows="10" placeholder="Write about this week\'s topic: ' + esc(topicNow()) + '">' + esc(draft) + '</textarea>' +
    '<p class="hint" id="wc">0 words</p>' + aiButtons('go', 'Correct in Claude') + '</section>' + importerHTML('write') +
    '<p class="pad"><button class="linkbtn danger" data-a="clear">Clear text</button></p>';
  const ta = box.querySelector('#tx'), wc = box.querySelector('#wc');
  const count = () => { const n = (ta.value.trim().match(/\S+/g) || []).length; wc.textContent = n + ' words'; try { localStorage.setItem('eg.draft', ta.value); } catch (e) { /* ignore */ } };
  ta.addEventListener('input', count); count();
  bindAI(box, () => { if (!ta.value.trim()) { toast('Write something first.'); return null; } return WRITE_PROMPT.replace('{TEXT}', ta.value.trim()); });
  bindImporter(box, 'Writing');
  box.addEventListener('click', async e => { if (e.target.closest('[data-a="clear"]') && await ask('Clear your text?', 'Clear', true)) { ta.value = ''; count(); } });
}

/* ---------- Recording helpers ---------- */
async function saveRecording(kind, title, r) {
  const rec = { id: uid('r'), kind, title, day: todayKey(), ts: Date.now(), ms: r.ms, type: r.blob.type, blob: r.blob };
  await dbPut('recordings', rec);
  return rec;
}
function minutesOf(ms) { return Math.max(1, Math.round(ms / 60000)); }

function fourThreeTwo(box) {
  const LENGTHS = [240, 180, 120];
  const st = { round: 0, rec: null, left: 0, iv: null, takes: [], topic: topicNow() };
  function draw() {
    if (st.round >= 3) {
      box.innerHTML = header('4/3/2 fluency', 'speak') + '<section class="card"><h2>Done: 3 versions</h2><p class="hint">Listen to all three. The last one should sound faster and smoother.</p><ul class="list">' +
        st.takes.map((t, i) => '<li><div class="row"><span class="txt">Version ' + (i + 1) + ' · ' + fmtClock(t.ms) + '</span><button class="btn small" data-play="' + i + '">Play</button></div></li>').join('') + '</ul>' +
        '<div class="btnrow"><button class="btn primary" data-a="save">Save recordings</button><button class="btn" data-a="restart">New topic</button></div></section>';
      return;
    }
    const total = LENGTHS[st.round] * 1000;
    box.innerHTML = header('4/3/2 fluency', 'speak', 'Version ' + (st.round + 1) + ' of 3') +
      (st.round === 0 && !st.rec ? '<section class="card stack"><label for="topic">Topic</label><input id="topic" maxlength="140" value="' + esc(st.topic) + '"><p class="hint">Make 3 quick notes in your head, not sentences. Then talk without stopping.</p></section>' : '<section class="card"><p class="eyebrow">Topic</p><p>' + esc(st.topic) + '</p></section>') +
      '<section class="card center"><p class="clock big">' + fmtClock(st.rec ? st.left : total) + '</p>' +
      '<div class="meter"><i style="width:' + (st.rec ? 100 * (1 - st.left / total) : 0) + '%"></i></div>' +
      (st.rec ? '<button class="btn rec wide" data-a="stop">Stop early</button>' : '<button class="btn go wide" data-a="start">Start ' + LENGTHS[st.round] / 60 + '-minute version</button>') +
      '</section>' +
      (st.takes.length ? '<ul class="list">' + st.takes.map((t, i) => '<li><div class="row"><span class="txt">Version ' + (i + 1) + ' · ' + fmtClock(t.ms) + '</span><button class="btn small" data-play="' + i + '">Play</button></div></li>').join('') + '</ul>' : '');
  }
  async function start() {
    const t = box.querySelector('#topic'); if (t && t.value.trim()) st.topic = t.value.trim();
    stopPlayback();
    st.rec = new Recorder();
    try { await st.rec.start(); } catch (e) { st.rec = null; toast(micErrorText(e)); return; }
    const total = LENGTHS[st.round] * 1000, t0 = Date.now();
    st.left = total; draw();
    st.iv = setInterval(() => {
      st.left = Math.max(0, total - (Date.now() - t0));
      const c = box.querySelector('.clock'), m = box.querySelector('.meter i');
      if (c) c.textContent = fmtClock(st.left);
      if (m) m.style.width = (100 * (1 - st.left / total)) + '%';
      if (st.left <= 0) stop();
    }, 250);
  }
  async function stop() {
    clearInterval(st.iv);
    if (!st.rec) return;
    const r = await st.rec.stop(); st.rec = null;
    if (r) { st.takes.push(r); await addLog('speak', minutesOf(r.ms), 'auto'); } else toast('Nothing was recorded. Check the microphone in More › Settings › Test microphone.');
    st.round++; draw();
  }
  box.addEventListener('click', async e => {
    const p = e.target.closest('[data-play]');
    if (p) { playBlob(st.takes[Number(p.dataset.play)].blob); return; }
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'start') start();
    else if (a === 'stop') stop();
    else if (a === 'save') { for (let i = 0; i < st.takes.length; i++) await saveRecording('432', '4/3/2 · ' + st.topic + ' · v' + (i + 1), st.takes[i]); toast('Saved in Your recordings.'); b.disabled = true; }
    else if (a === 'restart') { st.round = 0; st.takes = []; st.topic = topicNow(); draw(); }
  });
  draw();
  return () => { clearInterval(st.iv); if (st.rec) st.rec.cancel(); stopPlayback(); };
}

function simpleRecorder(box, opts) {
  const st = { rec: null, iv: null, take: null, saved: false };
  function draw() {
    const keep = {};
    box.querySelectorAll('textarea[id],input[id]').forEach(el => { keep[el.id] = el.value; });
    box.innerHTML = header(opts.title, 'speak', opts.sub) + opts.top() +
      '<section class="card center"><p class="clock big" id="clk">' + fmtClock(st.rec ? st.rec.elapsed() : st.take ? st.take.ms : 0) + '</p>' +
      (st.rec ? '<button class="btn rec wide" data-a="stop">Stop</button>' : '<button class="btn go wide" data-a="start">' + (st.take ? 'Record again' : 'Start recording') + '</button>') +
      (st.take ? '<div class="btnrow center"><button class="btn" data-a="play">Play</button>' + (st.saved ? '<span class="pill good">Saved</span>' : '<button class="btn primary" data-a="save">Save</button>') + '</div>' : '') +
      '</section>' + opts.bottom(st);
    Object.keys(keep).forEach(k => { const el = box.querySelector('#' + k); if (el) el.value = keep[k]; });
  }
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'start') {
      stopPlayback(); st.rec = new Recorder();
      try { await st.rec.start(); } catch (err) { st.rec = null; toast(micErrorText(err)); return; }
      st.take = null; st.saved = false; draw();
      st.iv = setInterval(() => {
        const el = box.querySelector('#clk'); if (el && st.rec) el.textContent = fmtClock(st.rec.elapsed());
        if (st.rec && st.rec.elapsed() >= opts.maxMs) { clearInterval(st.iv); const sb = box.querySelector('[data-a="stop"]'); if (sb) sb.click(); }
      }, 500);
    } else if (a === 'stop') {
      clearInterval(st.iv);
      if (!st.rec) return;
      const r = await st.rec.stop(); st.rec = null;
      if (r) { st.take = r; await addLog('speak', minutesOf(r.ms), 'auto'); } else toast('Nothing was recorded. Check the microphone in More › Settings › Test microphone.');
      draw();
    } else if (a === 'play' && st.take) playBlob(st.take.blob);
    else if (a === 'save' && st.take) { st.savedRec = await saveRecording(opts.kind, opts.recTitle(), st.take); st.saved = true; toast('Saved in Your recordings.'); draw(); }
    else if (opts.onClick) opts.onClick(a, st, draw);
  });
  draw();
  return () => { clearInterval(st.iv); if (st.rec) st.rec.cancel(); stopPlayback(); };
}

function diary(box) {
  let prompt = DIARY_PROMPTS[Math.floor(Math.random() * DIARY_PROMPTS.length)];
  return simpleRecorder(box, {
    title: 'Voice diary', sub: 'Speak for up to 5 minutes. Don\'t stop to fix mistakes.', kind: 'diary', maxMs: 300000,
    recTitle: () => 'Diary · ' + fmtShort(todayKey()),
    top: () => '<section class="card"><p class="eyebrow">Prompt</p><p class="big-q">' + esc(prompt) + '</p><button class="linkbtn" data-a="other">Another prompt</button></section>',
    bottom: () => '',
    onClick: (a, st, draw) => { if (a === 'other') { prompt = DIARY_PROMPTS[(DIARY_PROMPTS.indexOf(prompt) + 1) % DIARY_PROMPTS.length]; draw(); } }
  });
}

function sample(box) {
  let past = [];
  dbAll('recordings').then(all => { past = all.filter(r => r.kind === 'sample').sort((a, b) => b.ts - a.ts); const el = box.querySelector('#past'); if (el) el.innerHTML = pastHTML(); });
  const pastHTML = () => past.length ? past.map(r => '<li><div class="row"><span class="txt">' + esc(fmtShort(r.day)) + ' · ' + fmtClock(r.ms) + '</span><button class="btn small" data-rp="' + r.id + '">Play</button></div></li>').join('') : '<li class="empty">Your first sample will appear here. Compare them month by month.</li>';
  const cleanup = simpleRecorder(box, {
    title: 'Monthly sample', sub: 'Last Sunday of every month. Same 3 questions, 3 minutes, no preparation.', kind: 'sample', maxMs: 360000,
    recTitle: () => 'Monthly sample · ' + fmtShort(todayKey()),
    top: () => '<section class="card"><ol class="steps">' + SAMPLE_QUESTIONS.map(q => '<li>' + esc(q) + '</li>').join('') + '</ol></section>',
    bottom: st => '<section class="card stack"><h2>Get it analyzed</h2><p class="hint">Write what you said: play your recording and repeat it with keyboard dictation, or dictate while you answer the questions again.</p>' + micHint() +
      '<textarea id="tr" rows="6" placeholder="Transcript"></textarea>' + aiButtons('go', 'Analyze in Claude') + '</section>' + importerHTML('sample') +
      '<h2 class="sec">Past samples</h2><ul class="list" id="past">' + pastHTML() + '</ul>'
  });
  bindAI(box, () => {
    const tr = box.querySelector('#tr');
    if (!tr || !tr.value.trim()) { toast('Add the transcript first.'); return null; }
    const secs = past[0] ? Math.round(past[0].ms / 1000) : 180;
    return SAMPLE_PROMPT.replace('{SECONDS}', String(secs)).replace('{TEXT}', tr.value.trim());
  });
  bindImporter(box, 'Sample');
  box.addEventListener('click', e => { const b = e.target.closest('[data-rp]'); if (b) { const r = past.find(x => x.id === b.dataset.rp); if (r) playBlob(r.blob); } });
  return cleanup;
}

function recs(box) {
  let list = [];
  const LABEL = { '432': '4/3/2', diary: 'Diary', sample: 'Sample' };
  function draw() {
    box.innerHTML = header('Your recordings', 'speak', list.length + ' saved on this iPhone') + '<ul class="list">' +
      (list.length ? list.map(r => '<li><div class="row col"><span class="desc">' + esc(r.title) + '</span><span class="meta"><span class="pill">' + esc(LABEL[r.kind] || r.kind) + '</span> ' + esc(fmtShort(r.day)) + ' ' + fmtTime(r.ts) + ' · ' + fmtClock(r.ms) + '</span>' +
        '<span class="btnrow"><button class="btn small" data-a="play" data-id="' + r.id + '">Play</button><button class="btn small" data-a="share" data-id="' + r.id + '">Share</button><button class="linkbtn danger" data-a="del" data-id="' + r.id + '">Delete</button></span></div></li>').join('')
        : '<li class="empty">No recordings yet. Save one from 4/3/2, the voice diary or the monthly sample.</li>') + '</ul>' +
      '<p class="hint pad">Recordings stay only on this iPhone and are not included in backups. Share the important ones to Files to keep them.</p>';
  }
  dbAll('recordings').then(all => { list = all.sort((a, b) => b.ts - a.ts); draw(); });
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const r = list.find(x => x.id === b.dataset.id);
    if (!r) return;
    if (b.dataset.a === 'play') playBlob(r.blob);
    else if (b.dataset.a === 'share') {
      const ext = /webm/.test(r.type) ? 'webm' : 'm4a';
      const file = new File([r.blob], r.title.replace(/[^\w\- ]+/g, '').slice(0, 50) + '.' + ext, { type: r.type || 'audio/mp4' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: r.title }); } catch (err) { /* cancelled */ } }
      else toast('Sharing is not available here.');
    }
    else if (b.dataset.a === 'del' && await ask('Delete this recording?', 'Delete', true)) { await dbDel('recordings', r.id); list = list.filter(x => x.id !== r.id); draw(); toast('Recording deleted.'); }
  });
  box.innerHTML = header('Your recordings', 'speak') + '<p class="empty">Loading…</p>';
  return () => stopPlayback();
}
