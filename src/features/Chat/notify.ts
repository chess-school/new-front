// Сигналы о новом сообщении: короткий тон через WebAudio (без звуковых файлов)
// и счётчик непрочитанных в заголовке вкладки — «(3) Chess School».

let audio: AudioContext | null = null;

/** Двухнотный «динь»; молча ничего не делает, если звук недоступен или заблокирован браузером */
export const playMessageTone = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio = audio ?? new Ctx();
    if (audio.state === 'suspended') void audio.resume();
    const now = audio.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.connect(gain).connect(audio!.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  } catch {
    // нет звука — остаётся визуальный бейдж
  }
};

const BADGE_RE = /^\(\d+\+?\)\s/;

/** «(n) Заголовок» при n > 0; исходный заголовок без счётчика — при 0 */
export const setTitleBadge = (count: number) => {
  const base = document.title.replace(BADGE_RE, '');
  document.title = count > 0 ? `(${count > 99 ? '99+' : count}) ${base}` : base;
};
