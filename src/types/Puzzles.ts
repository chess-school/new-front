export interface IPuzzle {
  _id: string;
  fen: string;
  moves: string[]; // Массив ходов в формате UCI, например ['e2e4', 'e7e5']
  rating: number;
  themes: string[];
  popularity: number;
  nbPlays: number;
}