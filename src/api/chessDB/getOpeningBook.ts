
import axiosInstance from '@/api'; 

export interface IOpeningMove {
    san: string;
    games: number;
    wins: number;
    draws: number;
    losses: number;
}

export interface IOpeningBookData {
    moves: IOpeningMove[];
    total_games: number;
}

/**
 * Запрашивает статистику по позиции из дебютной книги.
 * @param fen - FEN-строка позиции.
 */
export const getOpeningBook = async (fen: string): Promise<IOpeningBookData> => {
  const encodedFen = encodeURIComponent(fen);
  const response = await axiosInstance.get(`/chessdb/book/${encodedFen}`);
  return response.data.data;
};