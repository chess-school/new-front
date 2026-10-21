import { ClockState, Color } from './playTypes';

/** Порог «мало времени» — часы краснеют и звучит предупреждение */
export const LOW_TIME_MS = 10000;

/**
 * Остаток стороны сейчас. Сервер присылает остатки на момент события; на клиенте отсчитываем
 * от момента получения (receivedAt, локальные часы) — расхождение часов клиента и сервера не важно.
 * Флаг решает только сервер.
 */
export const remainingMs = (clock: ClockState, color: Color, receivedAt: number, now: number, stopped = false): number => {
  const base = color === 'white' ? clock.whiteMs : clock.blackMs;
  if (stopped || !clock.running || clock.turn !== color) return base;
  return Math.max(0, base - (now - receivedAt));
};

/** 1:05:09 · 4:07 · 0:42 · 9.3 (десятые — когда меньше 10 секунд) */
export const formatClock = (ms: number): string => {
  const safe = Math.max(0, ms);
  if (safe < LOW_TIME_MS) {
    const tenths = Math.floor(safe / 100);
    return `${Math.floor(tenths / 10)}.${tenths % 10}`;
  }
  const total = Math.floor(safe / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

/** Подпись контроля «3+2» */
export const timeControlLabel = (tc: { initialSeconds: number; incrementSeconds: number }) =>
  `${tc.initialSeconds / 60}+${tc.incrementSeconds}`;
