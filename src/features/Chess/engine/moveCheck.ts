// Сравнение ходов по оценке движка: проверка хода ученика и проверка эталонного решения тренером.

import { formatScore, pvToSan, scoreForSide, StockfishEngine } from './stockfish';

/** Потеря до этой величины (сантипешки) — ход «так же хорош», как лучший */
export const EQUAL_MOVE_LOSS_CP = 50;
/** Потеря больше этой — ход эталонного решения сомнителен */
export const DUBIOUS_MOVE_LOSS_CP = 100;
const MATE_THRESHOLD = 90000;

export interface MoveComparison {
  /** Оценка после сыгранного хода и лучшая оценка позиции (строки для показа, точка зрения белых) */
  playedScore: string;
  bestScore: string;
  bestMove: string | null;
  bestMoveSan: string;
  /** Сколько ход теряет относительно лучшего, с точки зрения ходившего (>= 0) */
  lossCp: number;
  /** Ход по силе не уступает лучшему (в пределах EQUAL_MOVE_LOSS_CP или оба ведут к мату) */
  alsoStrong: boolean;
  /** Лучший ход ведёт к мату, а сыгранный — нет */
  missedMate: boolean;
}

/**
 * Насколько ход хуже лучшего. Два поиска подряд на одном движке: позиция до хода и после.
 * null — если поиск прерван (например, ученик уже сделал следующий ход).
 */
export const compareMove = async (
  engine: StockfishEngine,
  fenBefore: string,
  fenAfter: string,
  mover: 'w' | 'b',
  depth = 12,
): Promise<MoveComparison | null> => {
  const before = await engine.analyze(fenBefore, { depth });
  if (before.aborted || !before.lines[0]) return null;
  const after = await engine.analyze(fenAfter, { depth: Math.max(1, depth - 1) });
  if (after.aborted) return null;
  const best = scoreForSide(before.lines[0], mover);
  // Ход поставил мат — лучше не бывает; пат — ничья
  const played = after.terminal === 'checkmate' ? 100000 : after.lines[0] ? scoreForSide(after.lines[0], mover) : null;
  if (played === null) return null;

  const lossCp = Math.max(0, best - played);
  const bestIsMate = best >= MATE_THRESHOLD;
  const playedIsMate = played >= MATE_THRESHOLD;
  return {
    playedScore: formatScore(after.lines[0]),
    bestScore: formatScore(before.lines[0]),
    bestMove: before.bestMove,
    bestMoveSan: before.bestMove ? pvToSan(fenBefore, [before.bestMove], 1) : '',
    lossCp,
    alsoStrong: (bestIsMate && playedIsMate) || (!bestIsMate && lossCp <= EQUAL_MOVE_LOSS_CP),
    missedMate: bestIsMate && !playedIsMate,
  };
};

export interface SolutionMoveCheck {
  nodeId: number;
  label: string;           // «14. Bf5»
  comparison: MoveComparison;
  dubious: boolean;
}

interface CheckableNode {
  id: number;
  san: string;
  fen: string;
  color: 'w' | 'b';
  moveNumber: number;
  parent: { fen: string } | null;
}

/**
 * Проверка эталонного решения: для каждого хода решающей стороны в главной линии сравнивает
 * его с лучшим ходом движка. Ход сомнителен, если теряет > DUBIOUS_MOVE_LOSS_CP или упускает мат.
 */
export const checkSolution = async (
  engine: StockfishEngine,
  startFen: string,
  mainline: CheckableNode[],
  solver: 'w' | 'b',
  options: { depth?: number; onProgress?: (done: number, total: number) => void; isCancelled?: () => boolean } = {},
): Promise<SolutionMoveCheck[]> => {
  const solverMoves = mainline.filter((node) => node.color === solver);
  const results: SolutionMoveCheck[] = [];
  for (const [i, node] of solverMoves.entries()) {
    if (options.isCancelled?.()) break;
    const comparison = await compareMove(engine, node.parent ? node.parent.fen : startFen, node.fen, solver, options.depth ?? 14);
    if (!comparison) break;
    results.push({
      nodeId: node.id,
      label: `${node.moveNumber}${node.color === 'w' ? '.' : '...'} ${node.san}`,
      comparison,
      dubious: comparison.missedMate || comparison.lossCp > DUBIOUS_MOVE_LOSS_CP,
    });
    options.onProgress?.(i + 1, solverMoves.length);
  }
  return results;
};
