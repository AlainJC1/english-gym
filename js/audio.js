// Voices (offline iPhone text-to-speech), recording, and playback.
const NOVELTY = new Set(['Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Good News', 'Jester', 'Organ', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox', 'Junior', 'Ralph', 'Fred', 'Kathy', 'Deranged', 'Hysterical', 'Pipe Organ', 'Princess', 'Grandma', 'Grandpa', 'Rocko', 'Eddy', 'Flo', 'Reed', 'Sandy', 'Shelley']);
let voices = [];

export function loadVoices() {
  if (!('speechSynthesis' in window)) return [];
  voices = speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang) && !NOVELTY.has(v.name.replace(/\s*\(.*\)\s*$/, '').trim()));
  voices.sort((a, b) => quality(b) - quality(a) || a.lang.localeCompare(b.lang));
  return voices;
}
function quality(v) { return (/premium/i.test(v.name) ? 2 : 0) + (/enhanced|neural/i.test(v.name) ? 1 : 0) + (/en[-_]US/i.test(v.lang) ? 0.5 : 0); }
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener ? speechSynthesis.addEventListener('voiceschanged', loadVoices) : (speechSynthesis.onvoiceschanged = loadVoices);
}
export function enVoices() { return voices.length ? voices : loadVoices(); }
export function pickVoice(uri) {
  const vs = enVoices();
  return vs.find(v => v.voiceURI === uri) || vs.find(v => /en[-_]US/i.test(v.lang)) || vs[0] || null;
}
export function accentOf(v) {
  const m = (v.lang || '').replace('_', '-').split('-')[1] || '';
  return { US: 'American', GB: 'British', AU: 'Australian', IE: 'Irish', ZA: 'South African', IN: 'Indian', CA: 'Canadian', NZ: 'New Zealand', SC: 'Scottish' }[m.toUpperCase()] || m;
}

let speakSeq = 0;
export function speak(text, opts = {}) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window) || !text) { resolve(false); return; }
    const my = ++speakSeq;
    setAudioSession('playback');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = opts.voice || pickVoice(opts.voiceURI);
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-US'; }
    u.rate = opts.rate || 1;
    u.pitch = opts.pitch || 1;
    let done = false;
    const finish = ok => { if (done) return; done = true; clearTimeout(guard); resolve(ok && my === speakSeq); };
    const guard = setTimeout(() => finish(true), 1500 + text.length * 110 / (u.rate || 1));
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    // Small delay helps Safari after cancel().
    setTimeout(() => { if (my === speakSeq) speechSynthesis.speak(u); else finish(false); }, 60);
  });
}
export function stopSpeaking() { speakSeq++; if ('speechSynthesis' in window) speechSynthesis.cancel(); }

// iOS keeps the audio session in "record" mode after using the mic, which makes playback
// very quiet or silent. Safari's Audio Session API lets us switch it back.
export function setAudioSession(type) {
  try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (e) { /* not supported */ }
}

export function micErrorText(err) {
  const n = err && err.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'The microphone is blocked. On your iPhone: Settings › Apps › Safari › Microphone › Allow (or Ask). Then close and reopen the app.';
  if (n === 'NotFoundError') return 'No microphone was found.';
  if (n === 'NotReadableError' || n === 'AbortError') return 'The microphone is busy. Close other apps using it (calls, Voice Memos) and try again.';
  if (err && /not supported/i.test(err.message || '')) return 'Recording is not supported in this browser. Open the app from the Home Screen icon.';
  return 'Could not start the microphone' + (n ? ' (' + n + ')' : '') + '.';
}

// Records with the Web Audio API and saves a WAV file. iPhone home-screen apps can return
// empty files from MediaRecorder, but raw audio capture works reliably there.
const OUT_RATE = 16000;
export class Recorder {
  async start() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Recording is not supported here.');
    stopSpeaking(); stopPlayback();
    setAudioSession('play-and-record');
    // Create and resume the audio context inside the tap, before any await.
    this.ctx = new AC();
    const resumed = this.ctx.resume().catch(() => {});
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) { this.closeCtx(); setAudioSession('playback'); throw e; }
    await resumed;
    if (this.ctx.state !== 'running') { try { await this.ctx.resume(); } catch (e) { /* ignore */ } }
    this.rate = this.ctx.sampleRate;
    this.buffers = []; this.samples = 0; this.peak = 0;
    this.src = this.ctx.createMediaStreamSource(this.stream);
    this.proc = this.ctx.createScriptProcessor(4096, 1, 1);
    this.mute = this.ctx.createGain(); this.mute.gain.value = 0;
    this.proc.onaudioprocess = e => {
      if (!this.recording) return;
      const d = new Float32Array(e.inputBuffer.getChannelData(0));
      for (let i = 0; i < d.length; i += 16) { const a = Math.abs(d[i]); if (a > this.peak) this.peak = a; }
      this.buffers.push(d); this.samples += d.length;
    };
    this.src.connect(this.proc); this.proc.connect(this.mute); this.mute.connect(this.ctx.destination);
    this.recording = true;
    this.t0 = Date.now();
  }
  get active() { return !!this.recording; }
  elapsed() { return this.t0 ? Date.now() - this.t0 : 0; }
  get state() { return this.ctx ? this.ctx.state : 'none'; }
  async stop() {
    if (!this.recording) { this.release(); return null; }
    this.recording = false;
    const ms = Date.now() - this.t0;
    const info = { samples: this.samples, peak: this.peak, ctx: this.state };
    this.release();
    this.lastInfo = info;
    if (this.samples < this.rate * 0.3) return null;
    const blob = encodeWav(this.buffers, this.samples, this.rate);
    this.buffers = [];
    return { blob, ms, peak: info.peak };
  }
  closeCtx() { try { if (this.ctx && this.ctx.state !== 'closed') this.ctx.close(); } catch (e) { /* ignore */ } this.ctx = null; }
  release() {
    try { if (this.src) this.src.disconnect(); if (this.proc) { this.proc.disconnect(); this.proc.onaudioprocess = null; } if (this.mute) this.mute.disconnect(); } catch (e) { /* ignore */ }
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null; this.src = this.proc = this.mute = null;
    this.closeCtx();
    setAudioSession('playback');
  }
  cancel() { this.recording = false; this.buffers = []; this.release(); }
}

function encodeWav(buffers, total, inRate) {
  const ratio = inRate / OUT_RATE;
  const outLen = Math.floor(total / ratio);
  const pcm = new Int16Array(outLen);
  // Flatten lazily while averaging each output sample's input window (simple low-pass + decimate).
  let bi = 0, bo = 0, pos = 0;
  const read = () => { while (bi < buffers.length && bo >= buffers[bi].length) { bi++; bo = 0; } return bi < buffers.length ? buffers[bi][bo++] : 0; };
  let consumed = 0;
  for (let i = 0; i < outLen; i++) {
    const target = Math.floor((i + 1) * ratio);
    let sum = 0, n = 0;
    while (consumed < target) { sum += read(); n++; consumed++; }
    const v = n ? sum / n : 0;
    pcm[i] = Math.max(-1, Math.min(1, v)) * 0x7fff;
  }
  pos = 44 + pcm.length * 2;
  const buf = new ArrayBuffer(pos), dv = new DataView(buf);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) dv.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, OUT_RATE, true); dv.setUint32(28, OUT_RATE * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  return new Blob([buf], { type: 'audio/wav' });
}

let player = null, playerUrl = null;
export function playBlob(blob) {
  stopPlayback();
  stopSpeaking();
  setAudioSession('playback');
  if (!blob || !blob.size) return Promise.resolve(false);
  playerUrl = URL.createObjectURL(blob);
  player = new Audio();
  player.setAttribute('playsinline', '');
  player.preload = 'auto';
  player.volume = 1;
  player.src = playerUrl;
  const a = player;
  const p = new Promise(resolve => { a.onended = () => resolve(true); a.onerror = () => resolve(false); });
  return a.play().then(() => p, err => { window.dispatchEvent(new CustomEvent('eg:playerror', { detail: err && err.name })); return false; });
}
export function stopPlayback() {
  if (player) { try { player.pause(); } catch (e) { /* ignore */ } player = null; }
  if (playerUrl) { URL.revokeObjectURL(playerUrl); playerUrl = null; }
}

export function recognitionAvailable() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }

export function fmtClock(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
