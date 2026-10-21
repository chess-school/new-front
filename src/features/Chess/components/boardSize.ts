import { useSyncExternalStore } from 'react';

// Размер доски, общий для всех страниц и запоминаемый в браузере (см. ResizableBoard)

const STORAGE_KEY = 'board.size';
export const BOARD_MIN = 240;
export const BOARD_DEFAULT = 480;
export const BOARD_MAX = 1100;

export const clampBoard = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const readStored = (): number => {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(v) && v >= BOARD_MIN ? clampBoard(v, BOARD_MIN, BOARD_MAX) : BOARD_DEFAULT;
  } catch {
    return BOARD_DEFAULT;
  }
};

let preferred = readStored();
const listeners = new Set<() => void>();

/** Желаемый размер доски в px (до ограничения шириной контейнера и высотой экрана) */
export const setBoardSize = (px: number) => {
  preferred = clampBoard(Math.round(px), BOARD_MIN, BOARD_MAX);
  try {
    localStorage.setItem(STORAGE_KEY, String(preferred));
  } catch {
    // приватный режим — размер живёт до перезагрузки
  }
  listeners.forEach((l) => l());
};

export const useBoardSize = () => useSyncExternalStore(
  (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  () => preferred,
);
