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

export class Recorder {
  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) throw new Error('Recording is not supported here.');
    stopSpeaking(); stopPlayback();
    setAudioSession('play-and-record');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const types = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
    const type = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    try { this.mr = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined); }
    catch (e) { this.mr = new MediaRecorder(this.stream); }
    this.chunks = [];
    this.mr.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
    this.t0 = Date.now();
    // No timeslice: Safari writes one complete, playable file when it stops.
    this.mr.start();
  }
  get active() { return !!this.mr && this.mr.state === 'recording'; }
  elapsed() { return this.t0 ? Date.now() - this.t0 : 0; }
  stop() {
    return new Promise(resolve => {
      if (!this.mr || this.mr.state === 'inactive') { this.release(); resolve(null); return; }
      let done = false;
      const finish = () => {
        if (done) return; done = true;
        const blob = new Blob(this.chunks, { type: (this.mr.mimeType || 'audio/mp4').split(';')[0] });
        this.release();
        resolve(blob.size ? { blob, ms: Date.now() - this.t0 } : null);
      };
      this.mr.onstop = () => setTimeout(finish, 50); // let the last dataavailable land
      try { this.mr.requestData && this.mr.state === 'recording' && this.mr.requestData(); } catch (e) { /* ignore */ }
      this.mr.stop();
      setTimeout(finish, 3000);
    });
  }
  release() { if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null; setAudioSession('playback'); }
  cancel() { try { if (this.mr && this.mr.state !== 'inactive') { this.mr.onstop = null; this.mr.stop(); } } catch (e) { /* ignore */ } this.release(); }
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
