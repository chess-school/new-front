import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePuzzleSession } from './usePuzzleSession';
import { IPuzzle } from '@/types/Puzzles';

const wait = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)));
const base = { rating: 1500, themes: [], popularity: 0, nbPlays: 0 };

// Lichess: в FEN ходят чёрные, их ход Rf2xg2?.. — берём простую линию: 1... Kh8 2. Ra8#
const lichess: IPuzzle = {
  ...base, _id: 'lichess-x', fen: '6k1/5ppp/8/8/8/8/8/R5K1 b - - 0 1', moves: ['g8h8', 'a1a8'],
  startsWithOpponentMove: true, source: { kind: 'lichess' },
};
// Книга: ход белых сразу, линия 1. Kd2 h6 2. Ra8+ Kh7
const book: IPuzzle = {
  ...base, _id: 'book-x', fen: '7k/6pp/8/8/8/8/8/R3K3 w - - 0 1', moves: ['e1d2', 'h7h6', 'a1a8', 'h8h7'],
  startsWithOpponentMove: false, source: { kind: 'book', book: 'b', bookTitle: 'B', title: 'Exercise 2', sideToMove: 'w' },
};

describe('usePuzzleSession', () => {
  it('Lichess: сначала ход соперника, затем решение; мат последним ходом — решено', async () => {
    const { result } = renderHook(() => usePuzzleSession(lichess, { opponentDelayMs: 5 }));
    expect(result.current.status).toBe('opponent');
    expect(result.current.playerColor).toBe('w');
    await wait(20);
    expect(result.current.status).toBe('playing');
    expect(result.current.played).toEqual(['g8h8']);
    let v = '';
    act(() => { v = result.current.tryMove('a1', 'a7'); });
    expect(v).toBe('wrong');
    expect(result.current.mistakes).toBe(1);
    act(() => { v = result.current.tryMove('a1', 'a8'); });
    expect(v).toBe('correct');
    expect(result.current.status).toBe('solved');
    expect(result.current.played).toEqual(['g8h8', 'a1a8']);
  });

  it('книга: ход игрока сразу, ответ соперника по книге, линия кончается ответом — решено', async () => {
    const { result } = renderHook(() => usePuzzleSession(book, { opponentDelayMs: 5 }));
    expect(result.current.status).toBe('playing');
    act(() => { result.current.tryMove('e1', 'd2'); });
    expect(result.current.status).toBe('opponent');
    await wait(20);
    expect(result.current.played).toEqual(['e1d2', 'h7h6']);
    act(() => { result.current.tryMove('a1', 'a8'); });
    await wait(20);
    expect(result.current.status).toBe('solved');
    expect(result.current.played).toHaveLength(4);
  });

  it('превращение: выбранная фигура учитывается (раньше e7e8n засчитывался как e7e8q)', () => {
    const promo: IPuzzle = { ...book, _id: 'p', fen: '7k/4P3/8/8/8/8/8/K7 w - - 0 1', moves: ['e7e8q'] };
    const { result } = renderHook(() => usePuzzleSession(promo, { opponentDelayMs: 5 }));
    let v = '';
    act(() => { v = result.current.tryMove('e7', 'e8', 'n'); });
    expect(v).toBe('wrong');
    act(() => { v = result.current.tryMove('e7', 'e8', 'q'); });
    expect(v).toBe('correct');
  });

  it('на последнем ходу засчитывается любой мат', () => {
    const twoMates: IPuzzle = { ...book, _id: 'm', fen: '6k1/5ppp/8/8/8/8/8/R2R2K1 w - - 0 1', moves: ['a1a8'] };
    const { result } = renderHook(() => usePuzzleSession(twoMates, { opponentDelayMs: 5 }));
    let v = '';
    act(() => { v = result.current.tryMove('d1', 'd8'); });
    expect(v).toBe('correct');
    expect(result.current.status).toBe('solved');
  });

  it('регрессия: новая задача ни в одном рендере не выглядит «решённой» статусом прошлой', () => {
    const mateIn1: IPuzzle = { ...book, _id: 'a', fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', moves: ['a1a8'] };
    const seen: [string, string][] = [];
    const { result, rerender } = renderHook(({ p }) => {
      const s = usePuzzleSession(p, { opponentDelayMs: 5 });
      seen.push([p._id, s.status]);
      return s;
    }, { initialProps: { p: mateIn1 } });
    act(() => { result.current.tryMove('a1', 'a8'); });
    expect(result.current.status).toBe('solved');
    rerender({ p: { ...mateIn1, _id: 'b' } });
    // Режимы «Рейтинг»/«Выживание» засчитывали задачу по status === 'solved' в эффекте
    expect(seen.filter(([id, status]) => id === 'b' && status === 'solved')).toEqual([]);
    expect(result.current.status).toBe('playing');
  });

  it('«сдаться» -> failed; новая задача сбрасывает сессию', () => {
    const { result, rerender } = renderHook(({ p }) => usePuzzleSession(p, { opponentDelayMs: 5 }), { initialProps: { p: book } });
    act(() => { result.current.giveUp(); });
    expect(result.current.status).toBe('failed');
    rerender({ p: { ...book, _id: 'book-y' } });
    expect(result.current.status).toBe('playing');
    expect(result.current.played).toEqual([]);
    rerender({ p: null as unknown as IPuzzle });
    expect(result.current.status).toBe('idle');
  });
});
