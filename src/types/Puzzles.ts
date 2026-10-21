export type PuzzleSourceFilter = 'all' | 'lichess' | 'book';

export interface IPuzzle {
  _id: string;
  fen: string;
  moves: string[]; // Массив ходов в формате UCI, например ['e2e4', 'e7e5']
  rating: number;
  themes: string[];
  popularity: number;
  nbPlays: number;
  /** true (Lichess): moves[0] — ход соперника перед решением; false (книги): moves[0] — уже ход игрока */
  startsWithOpponentMove: boolean;
  source:
    | { kind: 'lichess' }
    | { kind: 'book'; book: string; bookTitle: string; exerciseNumber?: number; title: string; sideToMove: 'w' | 'b' };
}

/** Порядок источников в переключателях режимов задач */
export const PUZZLE_SOURCES: PuzzleSourceFilter[] = ['lichess', 'book', 'all'];
