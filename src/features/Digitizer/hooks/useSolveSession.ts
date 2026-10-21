import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { Exercise } from '@/types/PuzzleBook';
import { MoveNode, getMainline, parseSolution, sideToMove } from '../utils/pgnTree';

export type SolveStatus = 'playing' | 'opponent' | 'solved' | 'noSolution';
export type MoveVerdict = 'correct' | 'wrong' | 'ignored';

const OPPONENT_DELAY_MS = 500;
// ChessBoard передаёт fen в chess.js, а тот не понимает сокращение 'start'
const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Сессия решения одного упражнения: ученик играет за сторону, чей ход в стартовой позиции,
 * ходы сверяются с главной линией эталонного решения, ответы соперника делаются автоматически.
 */
export const useSolveSession = (exercise: Exercise | undefined) => {
  const { mainline, parseError } = useMemo(() => {
    if (!exercise) return { mainline: [] as MoveNode[], parseError: undefined };
    const { tree, error } = parseSolution(exercise.fen, exercise.solution || '');
    return { mainline: getMainline(tree), parseError: error };
  }, [exercise]);

  const game = useRef(new Chess());
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [fen, setFen] = useState(DEFAULT_FEN);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<SolveStatus>('playing');
  const [lastNode, setLastNode] = useState<MoveNode | null>(null);
  const [hintSquare, setHintSquare] = useState<Square | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const playerColor = exercise ? sideToMove(exercise.fen) : 'w';

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    if (!exercise) return;
    try {
      game.current.load(exercise.fen);
    } catch {
      game.current.reset();
    }
    setFen(game.current.fen());
    setIndex(0);
    setLastNode(null);
    setHintSquare(null);
    setMistakes(0);
    setStatus(mainline.length === 0 ? 'noSolution' : 'playing');
  }, [exercise, mainline]);

  // До отрисовки, чтобы при смене упражнения не мелькала предыдущая позиция
  useLayoutEffect(() => {
    reset();
    return () => clearTimeout(timer.current);
  }, [reset]);

  const finishOrContinue = useCallback((nextIndex: number) => {
    if (nextIndex >= mainline.length) {
      setStatus('solved');
      return;
    }
    // Ответ соперника из главной линии решения
    setStatus('opponent');
    timer.current = setTimeout(() => {
      const reply = mainline[nextIndex];
      game.current.move(reply.san);
      setFen(game.current.fen());
      setLastNode(reply);
      setIndex(nextIndex + 1);
      setStatus(nextIndex + 1 >= mainline.length ? 'solved' : 'playing');
    }, OPPONENT_DELAY_MS);
  }, [mainline]);

  /** Ход ученика. Возвращает вердикт; при 'wrong' ход уже отменён на доске. */
  const tryMove = useCallback((from: Square, to: Square, promotion?: string): MoveVerdict => {
    if (status !== 'playing') return 'ignored';
    const expected = mainline[index];
    if (!expected) return 'ignored';

    let move;
    try {
      move = game.current.move(promotion ? { from, to, promotion } : { from, to });
    } catch {
      return 'ignored'; // нелегальный ход — доска просто вернёт фигуру
    }
    if (!move) return 'ignored';

    // Любой мат принимается, даже если в книге указан другой матующий ход
    const isCorrect = move.san === expected.san || (expected.san.endsWith('#') && game.current.isCheckmate());
    if (!isCorrect) {
      game.current.undo();
      setMistakes((m) => m + 1);
      return 'wrong';
    }

    setFen(game.current.fen());
    setLastNode(expected);
    setHintSquare(null);
    if (move.san !== expected.san) {
      setStatus('solved'); // альтернативный мат завершает задачу
    } else {
      setIndex(index + 1);
      finishOrContinue(index + 1);
    }
    return 'correct';
  }, [status, mainline, index, finishOrContinue]);

  /** Подсвечивает поле фигуры, которой нужно ходить */
  const showHint = useCallback(() => {
    const expected = mainline[index];
    if (!expected || status !== 'playing') return;
    const probe = new Chess(game.current.fen());
    setHintSquare(probe.move(expected.san).from);
  }, [mainline, index, status]);

  return {
    fen,
    status,
    playerColor,
    mainline,
    parseError,
    lastNode,
    hintSquare,
    mistakes,
    movesPlayed: index,
    tryMove,
    showHint,
    reset,
  };
};
