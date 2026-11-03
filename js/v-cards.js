import { S, esc, header, todayKey, cardCounts, putCard, delCard, addCard, bumpRevlog, say, stopSpeaking, trackStart, toast, ask, emit } from './core.js';
import { schedule, preview, startOfDay, endOfDay, fmtWait } from './fsrs.js';

const CAT_LABEL = { conv: 'Conversation', pv: 'Phrasal verb', err: 'Common mistake', ff: 'False friend', med: 'Medical', phrase: 'Your phrase', mistake: 'Your mistake', user: 'Your card' };

export function renderCards(box, params) {
  const sub = params[0] || '';
  if (sub === 'study') return study(box);
  if (sub === 'browse') return browse(box);
  if (sub === 'add') return addForm(box);
  return home(box);
}

function home(box) {
  const c = cardCounts();
  const learned = S.cards.filter(x => x.state === 'review').length;
  const mature = S.cards.filter(x => x.state === 'review' && x.s >= 21).length;
  const today = S.revlog[todayKey()] || null;
  const due = c.review + c.learning + c.newLeft;
  box.innerHTML = header('Cards', null, 'Say each phrase aloud before you flip it.') +
    '<section class="card"><div class="stats3">' +
      '<div><p class="eyebrow">Reviews</p><p class="bignum">' + c.review + '</p></div>' +
      '<div><p class="eyebrow">Learning</p><p class="bignum">' + c.learning + '</p></div>' +
      '<div><p class="eyebrow">New</p><p class="bignum">' + c.newLeft + '</p></div></div>' +
      '<a class="btn go wide" href="#cards/study">' + (due ? 'Study now' : 'Study (nothing due)') + '</a>' +
      (today ? '<p class="hint">' + today.n + ' answers today.</p>' : '') +
    '</section>' +
    '<ul class="list">' +
      '<li><a class="row" href="#cards/add"><span class="txt"><span class="desc">Add a card</span></span><span class="chev">›</span></a></li>' +
      '<li><a class="row" href="#cards/browse"><span class="txt"><span class="desc">Browse all cards</span><span class="cat">' + c.total + ' cards · ' + learned + ' learned · ' + mature + ' strong</span></span><span class="chev">›</span></a></li>' +
      '<li><a class="row" href="#more/phrases"><span class="txt"><span class="desc">Phrase inbox</span><span class="cat">Turn saved phrases into cards</span></span><span class="chev">›</span></a></li>' +
    '</ul>' +
    '<p class="hint pad">New cards per day: ' + S.settings.newPerDay + '. Change it in Settings.</p>';
}

function pickNext(state) {
  const now = Date.now(), eod = endOfDay(now), sod = startOfDay(now);
  const active = S.cards.filter(c => !c.suspended);
  const learningDue = active.filter(c => (c.state === 'learning' || c.state === 'relearning') && c.due <= now).sort((a, b) => a.due - b.due);
  if (learningDue.length) return learningDue[0];
  const reviews = active.filter(c => c.state === 'review' && c.due <= eod).sort((a, b) => a.due - b.due);
  const newToday = active.filter(c => c.firstSeen && c.firstSeen >= sod).length;
  const newLeft = Math.max(0, S.settings.newPerDay - newToday);
  const news = newLeft ? active.filter(c => c.state === 'new' || !c.state).sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  if (news.length && (!reviews.length || state.sinceNew >= 3)) { state.sinceNew = 0; return news[0]; }
  if (reviews.length) { state.sinceNew++; return reviews[0]; }
  const soon = active.filter(c => (c.state === 'learning' || c.state === 'relearning') && c.due <= now + 20 * 6e4).sort((a, b) => a.due - b.due);
  return soon[0] || null;
}

function study(box) {
  trackStart('anki');
  const state = { card: null, flipped: false, sinceNew: 0, done: 0, again: 0, history: [] };
  function draw() {
    const c = state.card = state.force || pickNext(state);
    state.force = null;
    state.flipped = false;
    const cc = cardCounts();
    if (!c) {
      const later = cc.learnSoon ? ' Learning cards come back in ' + fmtWait(cc.learnSoon - Date.now()) + '.' : '';
      box.innerHTML = header('Cards', 'cards') +
        '<section class="card done-card"><p class="bignum">✓</p><h2>' + (state.done ? 'Session done' : 'Nothing due right now') + '</h2>' +
        '<p class="hint">' + (state.done ? state.done + ' answers · ' + Math.round(100 * (state.done - state.again) / state.done) + '% remembered.' : 'Come back tomorrow, or add more new cards in Settings.') + later + '</p>' +
        '<div class="btnrow center"><a class="btn" href="#today">Back to Today</a><a class="btn" href="#cards/add">Add a card</a></div></section>';
      return;
    }
    const isFix = c.kind === 'fix';
    box.innerHTML = header('Cards', 'cards') +
      '<p class="counts"><span class="c-new">' + cc.newLeft + ' new</span> · <span class="c-learn">' + cc.learning + ' learning</span> · <span class="c-rev">' + cc.review + ' review</span></p>' +
      '<section class="flash card" aria-live="polite">' +
        '<p class="eyebrow">' + esc(CAT_LABEL[c.cat] || 'Card') + '</p>' +
        '<p class="prompt">' + (isFix ? 'Correct this sentence, aloud:' : 'Say it in English, aloud:') + '</p>' +
        '<p class="es' + (isFix ? ' wrong' : '') + '">' + esc(c.es) + '</p>' +
        (c.hint ? '<p><span class="pill warn">' + esc(c.hint) + '</span></p>' : '') +
        '<div id="back" hidden><hr><p class="en">' + esc(c.en) + '</p>' +
          '<div class="btnrow center"><button class="btn small" data-act="play">Play</button><button class="btn small" data-act="slow">Slow</button></div>' +
          (c.note ? '<p class="note">' + esc(c.note) + '</p>' : '') + '</div>' +
      '</section>' +
      '<div class="answer-bar" id="bar"><button class="btn primary wide" data-act="flip">Show answer</button></div>' +
      (state.history.length ? '<p class="pad"><button class="linkbtn" data-act="undo">Undo last answer</button></p>' : '');
  }
  function flip() {
    if (!state.card || state.flipped) return;
    state.flipped = true;
    box.querySelector('#back').hidden = false;
    const pv = preview(state.card);
    const labels = ['Again', 'Hard', 'Good', 'Easy'];
    box.querySelector('#bar').innerHTML = '<div class="grade">' + labels.map((l, i) =>
      '<button class="btn g' + (i + 1) + '" data-grade="' + (i + 1) + '"><span>' + l + '</span><small>' + pv[i] + '</small></button>').join('') + '</div>';
    if (S.settings.autoplay) say(state.card.en);
  }
  async function grade(g) {
    const c = state.card;
    if (!c) return;
    stopSpeaking();
    state.history.push(Object.assign({}, c));
    if (state.history.length > 20) state.history.shift();
    const n = schedule(c, g);
    await putCard(n);
    await bumpRevlog(g === 1);
    state.done++; if (g === 1) state.again++;
    emit();
    draw();
  }
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-act],[data-grade]');
    if (!b) return;
    if (b.dataset.grade) return grade(Number(b.dataset.grade));
    const a = b.dataset.act;
    if (a === 'flip') flip();
    else if (a === 'play') say(state.card.en);
    else if (a === 'slow') say(state.card.en, { rate: 0.7 });
    else if (a === 'undo') {
      const prev = state.history.pop();
      if (prev) { await putCard(prev); state.done = Math.max(0, state.done - 1); state.force = prev; toast('Undone.'); draw(); }
    }
  });
  draw();
  return () => stopSpeaking();
}

function browse(box) {
  let q = '';
  function draw() {
    const terms = q.toLowerCase();
    const list = S.cards.filter(c => !terms || (c.es + ' ' + c.en).toLowerCase().includes(terms))
      .sort((a, b) => (a.state === 'new') - (b.state === 'new') || (a.due || 0) - (b.due || 0)).slice(0, 200);
    box.querySelector('#res').innerHTML = list.map(c => '<li><div class="row col"><span class="desc">' + esc(c.en) + '</span><span class="sub">' + esc(c.es) + '</span>' +
      '<span class="meta"><span class="pill">' + esc(CAT_LABEL[c.cat] || 'Card') + '</span> ' + (c.state === 'new' ? 'New' : c.state === 'review' ? 'Next in ' + fmtWait(Math.max(0, c.due - Date.now())) : 'Learning') +
      (c.suspended ? ' · <b>Paused</b>' : '') + '</span>' +
      '<span class="btnrow"><button class="linkbtn" data-act="play" data-id="' + c.id + '">Play</button><button class="linkbtn" data-act="pause" data-id="' + c.id + '">' + (c.suspended ? 'Resume' : 'Pause') + '</button><button class="linkbtn danger" data-act="del" data-id="' + c.id + '">Delete</button></span></div></li>').join('') ||
      '<li class="empty">No cards match.</li>';
  }
  box.innerHTML = header('All cards', 'cards') + '<div class="pad"><input id="q" type="search" placeholder="Search English or Spanish" aria-label="Search cards"></div><ul class="list" id="res"></ul>';
  box.querySelector('#q').addEventListener('input', e => { q = e.target.value; draw(); });
  box.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const c = S.cards.find(x => x.id === b.dataset.id);
    if (!c) return;
    if (b.dataset.act === 'play') say(c.en);
    else if (b.dataset.act === 'pause') { c.suspended = !c.suspended; await putCard(c); draw(); }
    else if (b.dataset.act === 'del' && await ask('Delete this card?\n' + c.en, 'Delete', true)) { await delCard(c.id); draw(); toast('Card deleted.'); }
  });
  draw();
}

function addForm(box) {
  box.innerHTML = header('Add a card', 'cards') +
    '<form class="card stack" id="f" novalidate>' +
    '<label for="es">Front: Spanish (or a prompt)</label><input id="es" maxlength="200" required placeholder="e.g. Se me olvidó por completo.">' +
    '<label for="en">Back: English</label><input id="en" maxlength="200" required placeholder="e.g. It completely slipped my mind.">' +
    '<label for="note">Note (optional)</label><input id="note" maxlength="200" placeholder="When to use it">' +
    '<button class="btn primary" type="submit">Add card</button></form>';
  box.querySelector('#f').addEventListener('submit', async e => {
    e.preventDefault();
    const es = box.querySelector('#es').value.trim(), en = box.querySelector('#en').value.trim(), note = box.querySelector('#note').value.trim();
    if (!es || !en) { toast('Fill in both sides.'); return; }
    await addCard({ es, en, note });
    box.querySelector('#es').value = ''; box.querySelector('#en').value = ''; box.querySelector('#note').value = '';
    box.querySelector('#es').focus();
    toast('Card added.');
  });
}
