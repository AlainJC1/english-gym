import { S, CAT, esc, todayKey, fmtDay, fmtShort, fmtTime, weekInfo, weekFocus, planFor, dayTotals, streaks, MIN_DAY,
  addLog, delLog, startTimer, stopTimer, cancelTimer, cardCounts, startKey, toast, go } from './core.js';
import { CATS } from '../data/content.js';

let selCat = 'listen';

export function renderToday(box) {
  let clockIv = null;
  function draw() {
    const k = todayKey(), w = weekInfo(k), f = weekFocus(k), t = dayTotals(k), plan = planFor(k);
    const planned = plan.reduce((a, p) => a + p.min, 0);
    const st = streaks(), cc = cardCounts();
    const due = cc.review + cc.learning + cc.newLeft;
    const running = !!S.timer;
    if (running) selCat = S.timer.cat;

    let focus;
    if (f.kind === 'week') {
      focus = '<p class="eyebrow">Week ' + f.week + ' focus</p><dl class="focus">' +
        '<dt>Sound</dt><dd><a href="#' + esc(f.soundRoute) + '">' + esc(f.sound) + ' ›</a></dd>' +
        '<dt>Grammar</dt><dd>' + (f.grammarId ? '<a href="#more/grammar/' + f.grammarId + '">' + esc(f.grammar) + ' ›</a>' : '<a href="#more/mistakes">' + esc(f.grammar) + ' ›</a>') + '</dd>' +
        '<dt>Talk about</dt><dd><a href="#speak/432">' + esc(f.topic) + ' ›</a></dd></dl>';
    } else if (f.kind === 'month') {
      focus = '<p class="eyebrow">Phase ' + w.phase + ' · this month</p><p>' + esc(f.text) + '</p><p class="hint">Talk about: <a href="#speak/432">' + esc(f.topic) + '</a></p>';
    } else {
      focus = '<p class="eyebrow">Setup week · Week 1 starts ' + esc(fmtDay(startKey())) + '</p><ol class="steps">' +
        '<li>Take the EF SET at efset.org (50 min, free) and add your score in <a href="#more/progress">Progress</a>.</li>' +
        '<li>Record your <a href="#speak/sample">baseline sample</a> (3 minutes).</li>' +
        '<li>Try your first <a href="#cards/study">cards</a> and a <a href="#pron/pairs/iy-ih">sound game</a>.</li>' +
        '<li>Book 3 trial classes with different tutors on italki.</li></ol>';
    }

    const planHTML = plan.map(p => {
      const done = t.byCat[p.cat] || 0, r = Math.min(1, done / p.min);
      const cls = r >= 1 ? 'tick full' : r > 0 ? 'tick part' : 'tick';
      const inner = '<span class="' + cls + '" style="--p:' + Math.round(r * 100) + '%" aria-hidden="true">✓</span>' +
        '<span class="txt"><span class="cat">' + esc(CAT[p.cat].label) + '</span><span class="desc">' + esc(p.text) + '</span></span>' +
        '<span class="mins">' + done + '/' + p.min + '</span>';
      return p.link ? '<li><a class="row" href="#' + esc(p.link) + '">' + inner + '<span class="chev">›</span></a></li>' : '<li><div class="row">' + inner + '<span class="chev"></span></div></li>';
    }).join('');

    const logs = S.log.filter(e => e.day === k).sort((a, b) => a.ts - b.ts);
    const logHTML = logs.length ? logs.map(e => '<li><div class="row"><span class="time">' + fmtTime(e.ts) + '</span><span class="txt">' + esc((CAT[e.cat] || {}).label || e.cat) + (e.src === 'auto' ? ' <span class="pill">auto</span>' : '') + '</span><span class="mins">' + e.min + ' min</span><button class="iconbtn" data-act="del" data-id="' + e.id + '" aria-label="Delete entry">×</button></div></li>').join('')
      : '<li class="empty">Nothing yet today. Practice in the app and it logs itself, or use the timer for podcasts, series and classes.</li>';

    const chips = CATS.map(c => '<button class="chip" data-group="' + c.group + '" data-act="cat" data-cat="' + c.id + '" aria-pressed="' + (selCat === c.id) + '"' + (running ? ' disabled' : '') + '>' + esc(c.label) + '</button>').join('');

    box.innerHTML =
      '<header class="scr-head big"><div class="scr-title"><p class="eyebrow">' + esc(fmtDay(k)) + '</p><h1>Today</h1></div>' +
      '<span class="pill ' + (w.week ? 'next' : '') + '">' + (w.week ? 'Phase ' + w.phase + ' · Week ' + Math.min(w.week, 52) : 'Setup week') + '</span></header>' +
      '<section class="summary card">' +
        '<div><p class="eyebrow">Practiced</p><p class="bignum">' + t.total + '<span class="unit">/ ' + planned + ' min</span></p></div>' +
        '<div class="right"><p class="eyebrow">Streak</p><p class="bignum">' + st.cur + '<span class="unit">' + (st.cur === 1 ? 'day' : 'days') + '</span></p></div>' +
        '<div class="meter' + (planned && t.total >= planned ? ' done' : '') + '"><i style="width:' + (planned ? Math.min(100, t.total / planned * 100) : 0) + '%"></i></div>' +
        '<p class="hint">' + (t.total >= MIN_DAY ? 'Today counts for your streak.' : (MIN_DAY - t.total) + ' more minutes to keep your streak.') + '</p>' +
      '</section>' +
      '<a class="card cta" href="#cards/study"><div><p class="eyebrow">Cards</p><p class="cta-t">' + (due ? due + ' to study' : 'All done for today') + '</p>' +
        '<p class="hint">' + cc.review + ' reviews · ' + cc.learning + ' learning · ' + cc.newLeft + ' new</p></div><span class="chev">›</span></a>' +
      '<section class="card">' + focus + '</section>' +
      '<section class="card timer' + (running ? ' running' : '') + '"><div class="row-between"><h2>Timer</h2>' + (running ? '<span class="live">' + esc(CAT[S.timer.cat].label) + '</span>' : '') + '</div>' +
        '<p class="hint">For podcasts, series, reading and tutor classes outside the app.</p>' +
        '<div class="chips">' + chips + '</div><p class="clock" id="clock">00:00</p>' +
        '<div class="btnrow">' + (running ? '<button class="btn primary" data-act="stop">Stop and save</button><button class="btn ghost" data-act="cancel">Discard</button>' : '<button class="btn go" data-act="start">Start timer</button>') + '</div>' +
        '<div class="quick"><p class="eyebrow">Or add minutes you already did</p><div class="btnrow">' +
        [10, 15, 30, 60].map(m => '<button class="btn small" data-act="quick" data-min="' + m + '">+' + m + '</button>').join('') +
        '<input id="customMin" type="number" inputmode="numeric" min="1" max="600" placeholder="min" aria-label="Minutes"><button class="btn small" data-act="custom">Add</button></div></div>' +
      '</section>' +
      '<section><h2 class="sec">Today\'s plan' + (w.week ? '' : ' (preview)') + '</h2><ul class="list">' + planHTML + '</ul></section>' +
      '<section><h2 class="sec">Today\'s log</h2><ul class="list">' + logHTML + '</ul></section>';
    tickClock();
  }
  function tickClock() {
    const el = box.querySelector('#clock');
    if (!el) return;
    if (!S.timer) { el.textContent = '00:00'; return; }
    const s = Math.floor((Date.now() - S.timer.start) / 1000);
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    el.textContent = (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(sec).padStart(2, '0');
  }
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const a = b.dataset.act;
    if (a === 'cat') { selCat = b.dataset.cat; draw(); }
    else if (a === 'start') { await startTimer(selCat); }
    else if (a === 'stop') { const r = await stopTimer(); if (r) toast('Saved ' + r.min + ' min of ' + CAT[r.cat].label + '.'); }
    else if (a === 'cancel') { await cancelTimer(); toast('Timer discarded.'); }
    else if (a === 'quick') { const r = await addLog(selCat, Number(b.dataset.min)); if (r) toast('Added ' + r.min + ' min of ' + CAT[r.cat].label + '.'); }
    else if (a === 'custom') {
      const v = Number(box.querySelector('#customMin').value);
      const r = await addLog(selCat, v);
      toast(r ? 'Added ' + r.min + ' min of ' + CAT[r.cat].label + '.' : 'Enter between 1 and 600 minutes.');
    }
    else if (a === 'del') { await delLog(b.dataset.id); toast('Entry deleted.'); }
  });
  const onData = () => draw();
  window.addEventListener('eg:data', onData);
  draw();
  clockIv = setInterval(tickClock, 1000);
  return () => { clearInterval(clockIv); window.removeEventListener('eg:data', onData); };
}
