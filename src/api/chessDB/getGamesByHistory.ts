import { IGame } from "@/types";
import axiosInstance from "..";

/**
 * Запрашивает список партий, содержащих указанную позицию.
 * @param fen - FEN-строка позиции.
 */
export const getGamesByHistory = async (pgn: string): Promise<IGame[]> => {
  const response = await axiosInstance.post('/chessdb/games-by-history', { pgn });
  return response.data.data;
};