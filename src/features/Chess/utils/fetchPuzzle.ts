import { AxiosError } from 'axios';
import { getRandomPuzzle } from '@/api/puzzles';
import { IPuzzle, PuzzleSourceFilter } from '@/types/Puzzles';

/**
 * Следующая задача для режимов на время. Если в рейтинговом окне задач нет (404), окно
 * расширяется: ±window → ±300 → без рейтинга. Раньше режимы на 404 рекурсивно повторяли запрос
 * без конца (а «Рейтинг» уводил рейтинг ниже нуля и ловил 422).
 * @returns задача или null, если по источнику задач нет вовсе
 */
export const fetchPuzzleForRun = async (
  source: PuzzleSourceFilter,
  rating: number,
  window: number,
  exclude?: string,
): Promise<IPuzzle | null> => {
  const windows: (number | null)[] = [window, Math.max(window, 300), null];
  for (const w of windows) {
    try {
      return await getRandomPuzzle({
        source,
        exclude,
        ...(w === null ? {} : { minRating: Math.max(0, rating - w), maxRating: Math.min(4000, rating + w) }),
      });
    } catch (e) {
      if ((e as AxiosError).response?.status !== 404) throw e;
    }
  }
  return null;
};
