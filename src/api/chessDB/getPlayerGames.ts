
import axiosInstance from '@/api'; 

export interface IGame {
    _id: string;
    white: string;
    black: string;
    result: string;
    an: string; 
}

/**
 * Запрашивает партии по имени игрока.
 * @param playerName - Имя игрока для поиска.
 */
export const getPlayerGames = async (playerName: string): Promise<IGame[]> => {
    const response = await axiosInstance.get(`/chessdb/player/${playerName}`);
    return response.data.data;
};