import { describe, expect, it, vi } from 'vitest';
import { formatScore, parseInfoLine, pvToSan, scoreForSide, StockfishEngine, WorkerLike } from './stockfish';

/** Фейковый воркер: записывает команды, ответы движка подаются вручную через emit() */
class FakeWorker implements WorkerLike {
  sent: string[] = [];
  terminated = false;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  postMessage(message: string) { this.sent.push(message); }
  terminate() { this.terminated = true; }
  emit(...lines: string[]) { lines.forEach((line) => this.onmessage?.({ data: line })); }
  handshake() { this.emit('id name Stockfish Test', 'uciok', 'readyok'); }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const BLACK_TO_MOVE = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

describe('parseInfoLine', () => {
  it('разбирает глубину, оценку, multipv и линию', () => {
    expect(parseInfoLine('info depth 12 seldepth 18 multipv 2 score cp 34 nodes 100 pv e2e4 e7e5 g1f3', 'w'))
      .toEqual({ multipv: 2, depth: 12, scoreCp: 34, pv: ['e2e4', 'e7e5', 'g1f3'] });
  });

  it('оценка приводится к точке зрения белых, когда ходят чёрные', () => {
    expect(parseInfoLine('info depth 10 score cp 50 pv e7e5', 'b')?.scoreCp).toBe(-50);
    expect(parseInfoLine('info depth 10 score mate 3 pv d8h4', 'b')?.mate).toBe(-3);
  });

  it('пропускает строки без линии и границы окна поиска', () => {
    expect(parseInfoLine('info depth 5 currmove e2e4 currmovenumber 1', 'w')).toBeNull();
    expect(parseInfoLine('info depth 9 score cp 20 lowerbound pv e2e4', 'w')).toBeNull();
    expect(parseInfoLine('bestmove e2e4', 'w')).toBeNull();
  });
});

describe('formatScore / scoreForSide / pvToSan', () => {
  it('форматирует оценки', () => {
    expect(formatScore({ scoreCp: 150 })).toBe('+1.50');
    expect(formatScore({ scoreCp: -80 })).toBe('-0.80');
    expect(formatScore({ scoreCp: 0 })).toBe('0.00');
    expect(formatScore({ mate: 3 })).toBe('M3');
    expect(formatScore({ mate: -2 })).toBe('-M2');
  });

  it('мат важнее любой оценки, ближний мат — лучше дальнего', () => {
    expect(scoreForSide({ mate: 1 }, 'w')).toBeGreaterThan(scoreForSide({ mate: 5 }, 'w'));
    expect(scoreForSide({ mate: 5 }, 'w')).toBeGreaterThan(scoreForSide({ scoreCp: 2000 }, 'w'));
    expect(scoreForSide({ scoreCp: 120 }, 'b')).toBe(-120);
    expect(scoreForSide({ mate: -2 }, 'b')).toBeGreaterThan(90000);
  });

  it('UCI-линия в SAN с номерами ходов', () => {
    expect(pvToSan(START, ['e2e4', 'e7e5', 'g1f3'])).toBe('1. e4 e5 2. Nf3');
    expect(pvToSan(BLACK_TO_MOVE, ['e7e5', 'g1f3'])).toBe('1... e5 2. Nf3');
    expect(pvToSan('8/P6k/8/8/8/8/8/K7 w - - 0 1', ['a7a8q'])).toBe('1. a8=Q');
  });
});

describe('StockfishEngine', () => {
  it('рукопожатие UCI, анализ и результат с лучшим ходом', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    expect(worker.sent).toEqual(['uci']);
    const promise = engine.analyze(START, { depth: 8 });
    worker.handshake();
    await flush();
    expect(engine.isReady).toBe(true);
    expect(engine.name).toBe('Stockfish Test');
    expect(worker.sent.slice(-2)).toEqual([`position fen ${START}`, 'go depth 8']);
    worker.emit('info depth 7 score cp 30 pv e2e4 e7e5', 'info depth 8 score cp 35 pv d2d4 d7d5', 'bestmove d2d4 ponder d7d5');
    const result = await promise;
    expect(result).toMatchObject({ fen: START, depth: 8, bestMove: 'd2d4', aborted: false });
    expect(result.lines).toEqual([{ multipv: 1, depth: 8, scoreCp: 35, pv: ['d2d4', 'd7d5'] }]);
  });

  it('новый анализ прерывает старый; ответы прерванного поиска не попадают в новый', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    worker.handshake();
    const first = engine.analyze(START, { depth: 20 });
    await flush();
    worker.emit('info depth 5 score cp 40 pv e2e4');

    const second = engine.analyze(BLACK_TO_MOVE, { depth: 6 });
    const firstResult = await first;
    expect(firstResult.aborted).toBe(true);
    expect(firstResult.lines[0].pv).toEqual(['e2e4']);
    await flush();
    expect(worker.sent).toContain('stop');

    // Хвост первого поиска (до его bestmove) — чужой и должен быть отброшен
    worker.emit('info depth 6 score cp 999 pv d2d4', 'bestmove d2d4');
    await flush();
    worker.emit('info depth 6 score cp 25 pv e7e5', 'bestmove e7e5');
    const secondResult = await second;
    expect(secondResult.bestMove).toBe('e7e5');
    expect(secondResult.lines[0].scoreCp).toBe(-25); // ход чёрных -> точка зрения белых
  });

  it('новая позиция уходит в движок только после bestmove прерванного поиска (регрессия: Depth 0 после 1. e4)', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    worker.handshake();
    engine.analyze(START, { depth: 18 });
    await flush();
    const second = engine.analyze(BLACK_TO_MOVE, { depth: 6 });
    await flush();
    // Пока старый поиск не ответил, новой позиции в движке нет
    expect(worker.sent.slice(-1)).toEqual(['stop']);
    worker.emit('bestmove e2e4');
    await flush();
    expect(worker.sent.slice(-2)).toEqual([`position fen ${BLACK_TO_MOVE}`, 'go depth 6']);
    worker.emit('info depth 1 score cp 30 pv e7e5', 'info depth 6 score cp 25 pv e7e5', 'bestmove e7e5');
    const result = await second;
    expect(result).toMatchObject({ fen: BLACK_TO_MOVE, depth: 6, bestMove: 'e7e5', aborted: false });
  });

  it('если bestmove прерванного поиска не пришёл, анализ не зависает', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    worker.handshake();
    engine.analyze(START, { depth: 18 });
    await flush();
    vi.useFakeTimers();
    try {
      const second = engine.analyze(BLACK_TO_MOVE, { depth: 6 });
      await vi.advanceTimersByTimeAsync(3100);
      expect(worker.sent.slice(-2)).toEqual([`position fen ${BLACK_TO_MOVE}`, 'go depth 6']);
      worker.emit('info depth 6 score cp 25 pv e7e5', 'bestmove e7e5');
      expect((await second).depth).toBe(6);
    } finally {
      vi.useRealTimers();
    }
  });

  it('MultiPV: setoption отправляется только при смене числа линий', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    worker.handshake();
    const p = engine.analyze(START, { multiPv: 3 });
    await flush();
    worker.emit('info depth 4 multipv 1 score cp 30 pv e2e4', 'info depth 4 multipv 2 score cp 20 pv d2d4', 'info depth 4 multipv 3 score cp 10 pv g1f3', 'bestmove e2e4');
    expect((await p).lines.map((l) => l.pv[0])).toEqual(['e2e4', 'd2d4', 'g1f3']);
    const p2 = engine.analyze(START, { multiPv: 3 });
    await flush();
    worker.emit('bestmove e2e4');
    await p2;
    expect(worker.sent.filter((c) => c.startsWith('setoption name MultiPV'))).toEqual(['setoption name MultiPV value 3']);
  });

  it('release(owner) останавливает только поиск этого владельца', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    worker.handshake();
    const live = {};
    const check = engine.analyze(START, { depth: 10 }); // чужой поиск (без владельца)
    await flush();
    engine.release(live); // живой анализ уходит — проверку решения не трогает
    expect(worker.sent).not.toContain('stop');
    worker.emit('info depth 10 score cp 20 pv e2e4', 'bestmove e2e4');
    expect((await check).aborted).toBe(false);

    const own = engine.analyze(START, { depth: 10, owner: live });
    await flush();
    engine.release(live);
    expect(worker.sent).toContain('stop');
    expect((await own).aborted).toBe(true);
  });

  it('terminate() останавливает поиск и уничтожает воркер', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    worker.handshake();
    const p = engine.analyze(START);
    await flush();
    engine.terminate();
    expect(worker.terminated).toBe(true);
    expect(worker.onmessage).toBeNull();
    expect((await p).aborted).toBe(true);
    engine.terminate(); // повторный вызов безопасен
  });

  it('мат и пат на доске решаются без движка (Stockfish 2018 не шлёт bestmove в позиции без ходов)', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    worker.handshake();
    const mate = await engine.analyze('R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1');
    expect(mate).toMatchObject({ terminal: 'checkmate', aborted: false, bestMove: null });
    expect(formatScore(mate.lines[0])).toBe('#');
    const stalemate = await engine.analyze('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(stalemate.terminal).toBe('stalemate');
    expect(stalemate.lines[0].scoreCp).toBe(0);
    expect(worker.sent.some((c) => c.startsWith('go'))).toBe(false);
  });

  it('битый FEN в движок не отправляется', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    worker.handshake();
    expect((await engine.analyze('not a fen')).aborted).toBe(true);
    expect(worker.sent.some((c) => c.startsWith('position'))).toBe(false);
  });

  it('ошибка загрузки воркера не подвешивает analyze()', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    const p = engine.analyze(START);
    worker.onerror?.(new Error('404'));
    expect((await p).aborted).toBe(true);
    expect(engine.error).toMatch(/failed to load/);
  });
});
