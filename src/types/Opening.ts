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
