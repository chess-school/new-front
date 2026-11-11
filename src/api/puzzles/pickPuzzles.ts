import axiosInstance from '@/api';
import type { Exercise } from '@/types/PuzzleBook';

export interface PickParams {
  theme?: string;
  minRating?: number;
  maxRating?: number;
  count?: number;
}

/**
 * Пакет задач из базы Lichess (6,19М) по теме/рейтингу → готовые inline-упражнения
 * (fen = позиция после хода соперника, solution = SAN). Для пикера конструктора курсов (Фаза B).
 * Доступно только тренерам/админам.
 */
export const pickPuzzlesFromBase = async (params: PickParams): Promise<Exercise[]> => {
  const res = await axiosInstance.get('/puzzles/pick', { params });
  return res.data?.data?.exercises ?? [];
};
