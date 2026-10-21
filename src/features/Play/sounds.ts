// Звуки партии синтезируются WebAudio (без файлов): ход — короткий «стук», взятие — двойной,
// начало/конец партии — аккорд, мало времени — тихий сигнал. Нет звука — ничего не ломается.

let ctx: AudioContext | null = null;
let muted = false;
try { muted = localStorage.getItem('play.muted') === '1'; } catch { /* приватный режим */ }

export const isMuted = () => muted;
export const setMuted = (value: boolean) => {
  muted = value;
  try { localStorage.setItem('play.muted', value ? '1' : '0'); } catch { /* без сохранения */ }
};

const context = (): AudioContext | null => {
  if (muted || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx = ctx ?? new Ctx();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

const tone = (freq: number, start: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
  const audio = context();
  if (!audio) return;
  const t = audio.currentTime + start;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
};

const safely = (fn: () => void) => () => { try { fn(); } catch { /* нет звука */ } };

export const sounds = {
  move: safely(() => tone(220, 0, 0.08, 0.25, 'triangle')),
  capture: safely(() => { tone(180, 0, 0.07, 0.3, 'square'); tone(140, 0.05, 0.09, 0.25, 'triangle'); }),
  check: safely(() => { tone(660, 0, 0.1, 0.12); tone(880, 0.08, 0.12, 0.1); }),
  start: safely(() => { [523, 659, 784].forEach((f, i) => tone(f, i * 0.07, 0.2, 0.08)); }),
  end: safely(() => { [784, 659, 523].forEach((f, i) => tone(f, i * 0.09, 0.25, 0.08)); }),
  lowTime: safely(() => tone(1046, 0, 0.12, 0.06)),
};

/** Звук для хода по SAN: взятие (x), шах (+/#) или обычный ход */
export const playMoveSound = (san: string) => {
  if (/[+#]/.test(san)) sounds.check();
  else if (san.includes('x')) sounds.capture();
  else sounds.move();
};
