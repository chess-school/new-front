import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useEngineAnalysis, useStockfishEngine } from './useStockfish';
import { WorkerLike } from './stockfish';

class FakeWorker implements WorkerLike {
  static created: FakeWorker[] = [];
  sent: string[] = [];
  terminated = false;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  constructor() { FakeWorker.created.push(this); }
  postMessage(message: string) {
    this.sent.push(message);
    // Мини-движок: отвечает на рукопожатие и сразу «находит» ход
    if (message === 'uci') queueMicrotask(() => this.emit('id name Fake', 'uciok'));
    if (message === 'isready') queueMicrotask(() => this.emit('readyok'));
    if (message.startsWith('go')) queueMicrotask(() => this.emit('info depth 3 score cp 42 pv e2e4', 'bestmove e2e4'));
  }
  terminate() { this.terminated = true; }
  emit(...lines: string[]) { lines.forEach((line) => this.onmessage?.({ data: line })); }
}
const createWorker = () => new FakeWorker();
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('useStockfishEngine', () => {
  it('не создаёт воркер, пока движок не нужен; создаёт при включении; terminate при размонтировании', () => {
    FakeWorker.created = [];
    const { result, rerender, unmount } = renderHook(({ enabled }) => useStockfishEngine(enabled, createWorker), { initialProps: { enabled: false } });
    expect(FakeWorker.created).toHaveLength(0);
    expect(result.current.engine).toBeNull();

    rerender({ enabled: true });
    expect(FakeWorker.created).toHaveLength(1);
    rerender({ enabled: false });
    rerender({ enabled: true });
    expect(FakeWorker.created).toHaveLength(1); // один воркер на компонент

    unmount();
    expect(FakeWorker.created[0].terminated).toBe(true);
  });

  it('ensure() создаёт движок по требованию (подсказка без включённого анализа)', () => {
    FakeWorker.created = [];
    const { result, unmount } = renderHook(() => useStockfishEngine(false, createWorker));
    act(() => { result.current.ensure(); });
    expect(FakeWorker.created).toHaveLength(1);
    unmount();
    expect(FakeWorker.created[0].terminated).toBe(true);
  });
});

describe('useEngineAnalysis', () => {
  it('анализирует позицию и останавливает поиск при выключении', async () => {
    FakeWorker.created = [];
    const { result: engineHook } = renderHook(() => useStockfishEngine(true, createWorker));
    const engine = engineHook.current.engine;
    const { result, rerender } = renderHook(
      ({ enabled }) => useEngineAnalysis(engine, START, { enabled, debounceMs: 0, depth: 3 }),
      { initialProps: { enabled: true } },
    );
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(result.current.result?.bestMove).toBe('e2e4');
    expect(result.current.result?.lines[0].scoreCp).toBe(42);
    expect(result.current.analyzing).toBe(false);

    rerender({ enabled: false });
    expect(result.current.result).toBeNull();
  });

  it('быстрые переключения тумблера не оставляют анализ «висящим»', async () => {
    FakeWorker.created = [];
    const { result: engineHook } = renderHook(() => useStockfishEngine(true, createWorker));
    const engine = engineHook.current.engine;
    const { result, rerender } = renderHook(
      ({ enabled, fen }) => useEngineAnalysis(engine, fen, { enabled, debounceMs: 0, depth: 3 }),
      { initialProps: { enabled: true, fen: START } },
    );
    for (const enabled of [false, true, false, true, false, true]) rerender({ enabled, fen: START });
    rerender({ enabled: true, fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1' });
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(result.current.analyzing).toBe(false);
    expect(result.current.result?.fen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    // Выключение во время анализа гасит результат и не роняет следующий запуск
    rerender({ enabled: false, fen: START });
    expect(result.current.result).toBeNull();
    expect(FakeWorker.created).toHaveLength(1);
  });
});
