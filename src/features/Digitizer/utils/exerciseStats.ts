// Метрика решения одного упражнения — для модуля статистики.
// Отправляется на бэкенд (POST /puzzle-books/:id/attempts); дубль копится в localStorage
// как локальная история и запасной путь, если ученик офлайн/не авторизован.

import { recordExerciseAttempt } from '@/api/digitizer';
import { AttemptRatingResult } from '@/types/PuzzleBook';

export interface ExerciseStat {
  exerciseId: string;
  timeTakenSeconds: number; // Затраченное время в секундах
  attemptsCount: number;    // Количество ошибочных попыток
  usedHint: boolean;        // Использовалась ли подсказка
  solvedAt: string;         // ISO timestamp
  solved?: boolean;         // true — решено самостоятельно, false — «сдался»
}

// Накопитель метрик до появления бэкенда
const STORAGE_KEY = 'exerciseStats.pending';

const loadPending = (): ExerciseStat[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

/** Все накопленные метрики (для будущей выгрузки/отладки модуля статистики). */
export const getPendingExerciseStats = (): ExerciseStat[] => loadPending();

/**
 * Фиксирует метрику решения упражнения.
 * Возвращает пересчёт рейтингов (user/puzzle), если бэкенд его прислал, иначе undefined.
 */
export const saveExerciseStats = async (
  bookId: string,
  stat: ExerciseStat,
): Promise<AttemptRatingResult | undefined> => {
  // Локальная история/запасной путь
  try {
    const list = loadPending();
    list.push(stat);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Хранилище недоступно (приватный режим / переполнение) — некритично.
  }
  // Основной путь: отправляем на бэкенд для статистики тренера
  try {
    return await recordExerciseAttempt(bookId, {
      exerciseId: stat.exerciseId,
      solved: stat.solved !== false,
      timeTakenSeconds: stat.timeTakenSeconds,
      attemptsCount: stat.attemptsCount,
      usedHint: stat.usedHint,
    });
  } catch {
    // Офлайн / не авторизован — метрика осталась локально, это некритично.
    return undefined;
  }
};
