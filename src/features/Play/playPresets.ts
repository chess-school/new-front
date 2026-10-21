import { Speed } from './playTypes';

// Пресеты как на Lichess (совпадают с backend v2/utils/timeControl.js)
export const PRESETS = [
  { minutes: 1, increment: 0, speed: 'bullet' }, { minutes: 2, increment: 1, speed: 'bullet' },
  { minutes: 3, increment: 0, speed: 'blitz' }, { minutes: 3, increment: 2, speed: 'blitz' },
  { minutes: 5, increment: 0, speed: 'blitz' }, { minutes: 5, increment: 3, speed: 'blitz' },
  { minutes: 10, increment: 0, speed: 'rapid' }, { minutes: 15, increment: 10, speed: 'rapid' },
  { minutes: 30, increment: 0, speed: 'classical' },
] as const;

/** Категория рейтинга по ожидаемой длительности — как на сервере */
export const speedOf = (minutes: number, increment: number): Speed => {
  const estimate = minutes * 60 + 40 * increment;
  return estimate < 180 ? 'bullet' : estimate < 480 ? 'blitz' : estimate < 1500 ? 'rapid' : 'classical';
};
