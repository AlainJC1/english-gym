// Reusable pieces: AI launch buttons and the "paste the AI answer" importer.
import { S, esc, openAI, addMistake, addPhrase, phraseToCard, mistakeToCard, toast } from './core.js';
import { parseSaveBlock } from './text.js';

export function aiButtons(id, label = 'Open in Claude') {
  return '<div class="btnrow">' +
    '<button class="btn primary" data-ai="' + id + '" data-app="claude">' + esc(label) + '</button>' +
    '<button class="btn" data-ai="' + id + '" data-app="gemini">Gemini</button></div>';
}
// getPrompt(id) returns the prompt text for a button.
export function bindAI(root, getPrompt) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-ai]');
    if (!b) return;
    const p = getPrompt(b.dataset.ai);
    if (p) openAI(p, b.dataset.app);
  });
}

export function importerHTML(id, title = 'Save what the AI found') {
  return '<details class="importer" id="imp-' + id + '"><summary>' + esc(title) + '</summary>' +
    '<p class="hint">After the feedback, copy the AI\'s whole answer and paste it here. The app saves the mistakes and phrases from its ===SAVE=== block.</p>' +
    '<textarea id="imp-ta-' + id + '" rows="5" placeholder="Paste the AI answer here"></textarea>' +
    '<label class="check"><input type="checkbox" id="imp-cards-' + id + '" checked> Also make cards from them</label>' +
    '<div class="btnrow"><button class="btn" data-imp-paste="' + id + '">Paste</button><button class="btn primary" data-imp="' + id + '">Save</button></div>' +
    '<p class="hint" id="imp-res-' + id + '" aria-live="polite"></p></details>';
}
export function bindImporter(root, src) {
  root.addEventListener('click', async e => {
    const pb = e.target.closest('[data-imp-paste]');
    if (pb) {
      const ta = root.querySelector('#imp-ta-' + pb.dataset.impPaste);
      try { ta.value = await navigator.clipboard.readText(); } catch (err) { ta.focus(); toast('Tap the box and choose Paste.'); }
      return;
    }
    const b = e.target.closest('[data-imp]');
    if (!b) return;
    const id = b.dataset.imp;
    const ta = root.querySelector('#imp-ta-' + id);
    const res = root.querySelector('#imp-res-' + id);
    const cards = root.querySelector('#imp-cards-' + id).checked;
    const { mistakes, phrases } = parseSaveBlock(ta.value);
    if (!mistakes.length && !phrases.length) { res.textContent = 'No MISTAKE or PHRASE lines found. Ask the AI: "Give me the ===SAVE=== block."'; return; }
    let nm = 0, np = 0, nc = 0;
    for (const m of mistakes) { const r = await addMistake(m.said, m.correct, m.rule, src); if (r) { nm++; if (cards && await mistakeToCard(r)) nc++; } }
    for (const p of phrases) { const r = await addPhrase(p.en, p.es, src); if (r) { np++; if (cards && r.es && await phraseToCard(r)) nc++; } }
    ta.value = '';
    res.textContent = 'Saved ' + nm + ' mistakes and ' + np + ' phrases' + (cards ? ', ' + nc + ' new cards.' : '.');
    toast('Saved to your log.');
  });
}

export function emptyState(text) { return '<p class="empty">' + esc(text) + '</p>'; }

export function micHint() {
  return '<p class="hint">Tap the box, then the microphone key on your keyboard, and speak. iPhone dictation works offline.</p>';
}

export function hasData() { return S.log.length + S.phrases.length + S.mistakes.length > 0; }
