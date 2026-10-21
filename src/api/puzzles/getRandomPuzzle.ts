// src/services/puzzleService.ts

import axiosInstance from '@/api'; // Ваш настроенный экземпляр axios
import { IPuzzle, PuzzleSourceFilter } from '@/types/Puzzles';

// Определяем параметры для запроса
interface GetRandomPuzzleParams {
  minRating?: number;
  maxRating?: number;
  /** all — все, lichess — база Lichess, book — из оцифрованных книг (опубликованных) */
  source?: PuzzleSourceFilter;
  bookId?: string;
  /** id предыдущей задачи — чтобы не выпала та же */
  exclude?: string;
}

/**
 * Запрашивает случайную задачу с сервера.
 * @param params - Опциональные параметры для фильтрации по рейтингу и источнику.
 */
export const getRandomPuzzle = async (params?: GetRandomPuzzleParams): Promise<IPuzzle> => {
  const response = await axiosInstance.get('/puzzles/random', { params });
  return response.data.data;
};
