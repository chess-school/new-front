// @vitest-environment node
// Интеграция с настоящим движком: public/workers/stockfish.js в worker_threads (как Web Worker).
// Проверяет, что модуль движка правильно говорит с реальным Stockfish: мат, MultiPV, прерывание, terminate.
import { afterAll, describe, expect, it } from 'vitest';
import path from 'path';
import { Worker } from 'worker_threads';
import { StockfishEngine, WorkerLike } from './stockfish';
import { compareMove } from './moveCheck';

const SHIM = path.resolve(__dirname, '../../../../test-utils/stockfish-node-worker.cjs');

/** worker_threads.Worker -> интерфейс браузерного Worker */
const realWorker = (): WorkerLike => {
  const worker = new Worker(SHIM);
  const like: WorkerLike = {
    onmessage: null,
    onerror: null,
    postMessage: (message) => { if (process.env.SF_DEBUG) console.log('>>', message); worker.postMessage(message); },
    terminate: () => { worker.terminate(); },
  };
  worker.on('message', (data) => { if (process.env.SF_DEBUG && /bestmove|ok$/.test(String(data))) console.log('<<', data); like.onmessage?.({ data }); });
  worker.on('error', (error) => like.onerror?.(error));
  return like;
};

const engine = new StockfishEngine(realWorker);
afterAll(() => engine.terminate());

describe('Stockfish (настоящий движок)', () => {
  it('находит мат в 1 и сообщает имя движка', async () => {
    const result = await engine.analyze('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', { depth: 6 });
    expect(result.bestMove).toBe('a1a8');
    expect(result.lines[0].mate).toBe(1);
    expect(engine.name).toMatch(/Stockfish/);
  });

  it('мат за чёрных приводится к точке зрения белых (отрицательный)', async () => {
    const result = await engine.analyze('r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1', { depth: 6 });
    expect(result.bestMove).toBe('a8a1');
    expect(result.lines[0].mate).toBe(-1);
  });

  it('MultiPV 3 — три разные линии', async () => {
    const result = await engine.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', { depth: 6, multiPv: 3 });
    expect(result.lines).toHaveLength(3);
    expect(new Set(result.lines.map((l) => l.pv[0])).size).toBe(3);
  });

  it('прерванный поиск не портит следующий', async () => {
    const slow = engine.analyze('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', { depth: 30 });
    const fast = engine.analyze('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', { depth: 6 });
    expect((await slow).aborted).toBe(true);
    const result = await fast;
    expect(result.fen).toBe('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
    expect(result.bestMove).toBe('a1a8');
  });

  it('смена позиции во время глубокого поиска: новый поиск набирает глубину (регрессия: Depth 0 после 1. e4)', async () => {
    const depths: number[] = [];
    const slow = engine.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', { depth: 30, multiPv: 2 });
    await new Promise((r) => setTimeout(r, 800));
    const next = engine.analyze('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', { depth: 10, multiPv: 2, onUpdate: (p) => depths.push(p.depth) });
    expect((await slow).aborted).toBe(true);
    const result = await next;
    expect(result.depth).toBe(10);
    expect(result.lines).toHaveLength(2);
    expect(depths[0]).toBe(1);
  });

  it('после матовой позиции движок продолжает отвечать (регрессия: bestmove в мате не приходит)', async () => {
    const mate = await engine.analyze('R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1', { depth: 6 });
    expect(mate.terminal).toBe('checkmate');
    const next = await engine.analyze('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', { depth: 6 });
    expect(next.bestMove).toBe('a1a8');
  });

  it('сравнение ходов: зевок против лучшего хода', async () => {
    // Белые могут дать мат Ra8#, вместо этого играют Kf1
    const before = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    const blunder = '6k1/5ppp/8/8/8/8/8/R4K2 b - - 1 1';
    const cmp = await compareMove(engine, before, blunder, 'w', 8);
    expect(cmp?.missedMate).toBe(true);
    expect(cmp?.alsoStrong).toBe(false);
    expect(cmp?.bestMoveSan).toBe('1. Ra8#');

    const mate = 'R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1';
    const good = await compareMove(engine, before, mate, 'w', 8);
    expect(good?.alsoStrong).toBe(true);
  });
});
