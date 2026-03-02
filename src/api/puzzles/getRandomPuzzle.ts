// src/services/puzzleService.ts

import axiosInstance from '@/api'; // Ваш настроенный экземпляр axios
export interface IPuzzle {
  _id: string;
  fen: string;
  moves: string[]; // Массив ходов в формате UCI, например ['e2e4', 'e7e5']
  rating: number;
  themes: string[];
  popularity: number;
  nbPlays: number;
}
// Определяем параметры для запроса
interface GetRandomPuzzleParams {
  minRating?: number;
  maxRating?: number;
  theme?: string; // Добавляем необязательное поле theme

}

/**
 * Запрашивает случайную задачу с сервера.
 * @param params - Опциональные параметры для фильтрации по рейтингу.
 */
export const getRandomPuzzle = async (params?: GetRandomPuzzleParams): Promise<IPuzzle> => {
  const response = await axiosInstance.get('/puzzles/random', { params });
  return response.data.data; 
};