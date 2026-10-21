import { describe, expect, it } from 'vitest';
import { ARROW_COLORS, engineArrows, formatEvalShort, whitePercent, winningChances } from './evaluation';
import { AnalysisResult } from './stockfish';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const res = (lines: AnalysisResult['lines'], extra: Partial<AnalysisResult> = {}): AnalysisResult =>
  ({ fen: START, depth: 10, lines, bestMove: lines[0]?.pv[0] ?? null, aborted: false, ...extra });

describe('шкала оценки (формула Lichess)', () => {
  it('сигмоида: равенство — 50%, симметрия, насыщение', () => {
    expect(whitePercent(res([{ multipv: 1, depth: 10, scoreCp: 0, pv: ['e2e4'] }]))).toBe(50);
    // Lichess: +1.00 ≈ 59.1% белым
    expect(whitePercent(res([{ multipv: 1, depth: 10, scoreCp: 100, pv: ['e2e4'] }]))).toBeCloseTo(59.1, 1);
    expect(winningChances(300)).toBeCloseTo(-winningChances(-300), 10);
    expect(winningChances(5000)).toBe(winningChances(1000)); // дальше ±10 пешек шкала не растёт
    expect(whitePercent(res([{ multipv: 1, depth: 10, scoreCp: 1000, pv: ['e2e4'] }]))).toBeGreaterThan(97);
  });

  it('мат — край шкалы, мат на доске — у поставившей мат стороны', () => {
    expect(whitePercent(res([{ multipv: 1, depth: 5, mate: 2, pv: ['e2e4'] }]))).toBe(100);
    expect(whitePercent(res([{ multipv: 1, depth: 5, mate: -3, pv: ['e2e4'] }]))).toBe(0);
    // Ходят чёрные и им мат -> у белых 100%
    expect(whitePercent(res([], { fen: 'R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1', terminal: 'checkmate' }))).toBe(100);
    expect(whitePercent(res([], { fen: '7k/8/8/8/8/8/5PPP/r5K1 w - - 1 1', terminal: 'checkmate' }))).toBe(0);
    expect(whitePercent(null)).toBe(50);
  });

  it('подписи как на Lichess', () => {
    const cp = (scoreCp: number) => formatEvalShort(res([{ multipv: 1, depth: 10, scoreCp, pv: ['e2e4'] }]));
    expect(cp(87)).toBe('+0.87');
    expect(cp(-780)).toBe('-7.8');
    expect(cp(1234)).toBe('+12');
    expect(cp(0)).toBe('0.00');
    expect(formatEvalShort(res([{ multipv: 1, depth: 5, mate: 2, pv: ['e2e4'] }]))).toBe('M2');
    expect(formatEvalShort(res([{ multipv: 1, depth: 5, mate: -3, pv: ['e2e4'] }]))).toBe('-M3');
    expect(formatEvalShort(res([], { terminal: 'checkmate' }))).toBe('#');
    expect(formatEvalShort(res([], { terminal: 'stalemate' }))).toBe('½');
  });
});

describe('стрелки лучших ходов', () => {
  it('лучший ход — зелёная, вторая линия — синяя; без повторов и в терминальной позиции', () => {
    const arrows = engineArrows(res([
      { multipv: 1, depth: 10, scoreCp: 30, pv: ['e2e4', 'e7e5'] },
      { multipv: 2, depth: 10, scoreCp: 20, pv: ['d2d4'] },
      { multipv: 3, depth: 10, scoreCp: 10, pv: ['g1f3'] },
    ]));
    expect(arrows).toEqual([['e2', 'e4', ARROW_COLORS[0]], ['d2', 'd4', ARROW_COLORS[1]]]);
    expect(engineArrows(res([{ multipv: 1, depth: 1, scoreCp: 0, pv: ['e2e4'] }, { multipv: 2, depth: 1, scoreCp: 0, pv: ['e2e4'] }]))).toHaveLength(1);
    expect(engineArrows(res([], { terminal: 'checkmate' }))).toEqual([]);
    expect(engineArrows(null)).toEqual([]);
  });
});
