import axiosInstance from '@/api';

export interface PuzzleAttemptResult {
  success: boolean;
  userRating: number;
  userRatingBefore: number;
  userDelta: number;
  puzzleRating: number;
}

/**
 * Записать попытку решения случайной задачи и получить новый рейтинг пользователя (Lichess-style).
 * silent: провал записи не критичен для UX — не показываем тост.
 */
export const recordPuzzleAttempt = async (puzzleId: string, success: boolean): Promise<PuzzleAttemptResult> => {
  const res = await axiosInstance.post('/puzzles/attempt', { puzzleId, success }, { silent: true });
  return res.data.data;
};
