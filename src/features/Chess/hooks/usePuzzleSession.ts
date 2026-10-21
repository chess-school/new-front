import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { IPuzzle } from '@/types/Puzzles';

export type PuzzleStatus = 'idle' | 'opponent' | 'playing' | 'solved' | 'failed';
export type PuzzleVerdict = 'correct' | 'wrong' | 'ignored';

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const uciOf = (move: { from: string; to: string; promotion?: string }) => `${move.from}${move.to}${move.promotion ?? ''}`;

interface Options {
  /** Пауза перед ходом соперника, мс */
  opponentDelayMs?: number;
}

/**
 * Решение одной задачи — общий для «Задачи», «Рейтинг» и «Выживание».
 *   Lichess (startsWithOpponentMove): moves[0] — ход соперника, решение с moves[1];
 *   книга: позиция уже с ходом игрока, решение с moves[0].
 * Ход сверяется в UCI с учётом выбранной фигуры при превращении; на последнем ходу засчитывается
 * любой мат. Ход соперника — по решению. played — сыгранные ходы от puzzle.fen (для разбора).
 */
export const usePuzzleSession = (puzzle: IPuzzle | null, { opponentDelayMs = 500 }: Options = {}) => {
  const game = useMemo(() => new Chess(), []);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [fen, setFen] = useState(DEFAULT_FEN);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<PuzzleStatus>('idle');
  const [played, setPlayed] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  // Для какой задачи это состояние. Первый рендер с новой задачей ещё несёт статус прошлой
  // (сброс — в layout-эффекте); без привязки режимы засчитывали новую задачу «решённой»
  const [boundId, setBoundId] = useState<string | null>(null);

  // До отрисовки: доска не должна мигнуть позицией прошлой задачи
  useLayoutEffect(() => {
    clearTimeout(timer.current);
    setMistakes(0);
    setBoundId(puzzle ? puzzle._id : null);
    if (!puzzle) {
      setStatus('idle');
      setPlayed([]);
      return undefined;
    }
    try {
      game.load(puzzle.fen);
    } catch {
      setStatus('failed');
      return undefined;
    }
    setFen(game.fen());
    setPlayed([]);
    if (puzzle.startsWithOpponentMove) {
      setPlayerColor(game.turn() === 'w' ? 'b' : 'w');
      setIndex(0);
      setStatus('opponent');
      timer.current = setTimeout(() => {
        const move = game.move(puzzle.moves[0]);
        setFen(game.fen());
        setPlayed([uciOf(move)]);
        setIndex(1);
        setStatus('playing');
      }, opponentDelayMs);
    } else {
      setPlayerColor(game.turn());
      setIndex(0);
      setStatus('playing');
    }
    return () => clearTimeout(timer.current);
  }, [puzzle, game, opponentDelayMs]);

  const tryMove = useCallback((from: Square, to: Square, promotion?: string): PuzzleVerdict => {
    if (!puzzle || status !== 'playing') return 'ignored';
    const expected = puzzle.moves[index];
    if (!expected) return 'ignored';

    let move;
    try {
      move = game.move({ from, to, promotion: promotion ?? (expected.length === 5 ? expected[4] : undefined) });
    } catch {
      return 'ignored'; // нелегальный ход — доска вернёт фигуру
    }
    const isLast = index + 1 >= puzzle.moves.length;
    const isCorrect = uciOf(move) === expected || (isLast && game.isCheckmate());
    if (!isCorrect) {
      game.undo();
      setMistakes((m) => m + 1);
      return 'wrong';
    }

    setFen(game.fen());
    setPlayed((p) => [...p, uciOf(move)]);
    const next = index + 1;
    if (next >= puzzle.moves.length) {
      setIndex(next);
      setStatus('solved');
      return 'correct';
    }
    setStatus('opponent');
    timer.current = setTimeout(() => {
      const reply = game.move(puzzle.moves[next]);
      setFen(game.fen());
      setPlayed((p) => [...p, uciOf(reply)]);
      setIndex(next + 1);
      // Линия кончается ответом соперника — задача решена
      setStatus(next + 1 >= puzzle.moves.length ? 'solved' : 'playing');
    }, opponentDelayMs);
    return 'correct';
  }, [puzzle, status, index, game, opponentDelayMs]);

  /** Сдаться: задача не решена, но для разбора доступна вся линия решения */
  const giveUp = useCallback(() => {
    if (!puzzle || status === 'solved' || status === 'failed') return;
    clearTimeout(timer.current);
    setStatus('failed');
  }, [puzzle, status]);

  /** Полная линия решения от puzzle.fen (включая ход соперника у Lichess) — для разбора */
  const solutionLine = puzzle ? puzzle.moves : [];

  // Пока состояние не перепривязано к текущей задаче — это ещё «ничего», а не итог прошлой
  const current = !!puzzle && boundId === puzzle._id;
  return {
    fen: current ? fen : puzzle?.fen ?? fen,
    status: current ? status : 'idle' as PuzzleStatus,
    playerColor,
    played: current ? played : [],
    mistakes: current ? mistakes : 0,
    index: current ? index : 0,
    solutionLine,
    tryMove,
    giveUp,
  };
};
