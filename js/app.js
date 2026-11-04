import { S, loadAll, trackStop, toast } from './core.js';
import { stopSpeaking } from './audio.js';
import { stopPlayback } from './audio.js';
import { renderToday } from './v-today.js';
import { renderCards } from './v-cards.js';
import { renderPron } from './v-pron.js';
import { renderSpeak } from './v-speak.js';
import { renderMore } from './v-more.js';

const ROUTES = { today: renderToday, cards: renderCards, pron: renderPron, speak: renderSpeak, more: renderMore };
let cleanup = null;

function route() {
  const parts = (location.hash.slice(1) || 'today').split('/').filter(Boolean);
  const tab = ROUTES[parts[0]] ? parts[0] : 'today';
  trackStop();
  stopSpeaking(); stopPlayback();
  if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
  const host = document.getElementById('view');
  const box = document.createElement('div');
  box.className = 'screen';
  host.replaceChildren(box);
  try { cleanup = ROUTES[tab](box, parts.slice(1)) || null; }
  catch (e) { console.error(e); box.innerHTML = '<p class="empty">Something went wrong on this screen. Go back and try again.</p>'; }
  document.querySelectorAll('.tabbar a').forEach(a => a.setAttribute('aria-current', a.dataset.tab === tab ? 'page' : 'false'));
  window.scrollTo(0, 0);
}

async function init() {
  try { await loadAll(); }
  catch (e) { document.getElementById('view').innerHTML = '<p class="empty">This browser cannot store data. Open the app from Safari and add it to your Home Screen.</p>'; return; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  window.addEventListener('hashchange', route);
  route();
  let lastDay = new Date().toDateString();
  setInterval(() => { const d = new Date().toDateString(); if (d !== lastDay) { lastDay = d; route(); } }, 60000);
  registerSW();
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  // Only an app that was already running offline gets the "new version" prompt.
  const hadController = !!navigator.serviceWorker.controller;
  let wantReload = false;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    const offer = w => {
      if (!hadController) return;
      const bar = document.getElementById('update');
      bar.hidden = false;
      bar.querySelector('button').onclick = () => { wantReload = true; w.postMessage('skipWaiting'); };
    };
    if (reg.waiting) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); });
    });
    setInterval(() => reg.update().catch(() => {}), 6 * 3600e3);
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (wantReload) { wantReload = false; location.reload(); } });
}

window.addEventListener('error', e => console.error(e.error || e.message));
window.addEventListener('eg:playerror', () => toast('Could not play the recording. Tap Play again.'));
init();
