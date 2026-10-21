// Stockfish в Web Worker (public/workers/stockfish.js) поверх протокола UCI.
//
// Один поиск за раз: новый analyze() прерывает текущий ('stop') и отправляет 'position'/'go'
// только после 'bestmove' прерванного поиска. Раньше команды уходили сразу, а Stockfish
// (stockfish.js, emscripten main loop) присылал 'info' нового поиска ДО 'bestmove' старого:
// счётчик «чужих» ответов выбрасывал их, и после первого хода анализ застывал на глубине 0.
// Все оценки приводятся к точке зрения белых: Stockfish считает от стороны, чей ход.

import { Chess } from 'chess.js';

export const STOCKFISH_WORKER_URL = '/workers/stockfish.js';

export interface EngineLine {
  multipv: number;
  depth: number;
  /** Оценка в сантипешках с точки зрения белых (если не мат) */
  scoreCp?: number;
  /** Мат в N ходов: > 0 — матуют белые, < 0 — чёрные */
  mate?: number;
  /** Главная линия в UCI */
  pv: string[];
}

export interface AnalysisResult {
  fen: string;
  depth: number;
  lines: EngineLine[];
  bestMove: string | null;
  /** Поиск прерван новым analyze()/stop() до достижения глубины */
  aborted: boolean;
  /** Позиция уже завершена: у стороны, чей ход, нет ходов (мат или пат) — движок не запускался */
  terminal?: 'checkmate' | 'stalemate';
}

export interface AnalyzeOptions {
  depth?: number;
  multiPv?: number;
  /** Вызывается на каждой новой глубине с текущими линиями */
  onUpdate?: (partial: AnalysisResult) => void;
  /** Кто запустил поиск: release(owner) остановит его, только если он всё ещё текущий */
  owner?: object;
}

/** Минимальный интерфейс воркера — чтобы в тестах подставлять фейк */
export interface WorkerLike {
  postMessage(message: string): void;
  terminate(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

// ---------------------------------------------------------------- разбор UCI

/** Разбирает строку 'info depth … score … pv …'; null, если в ней нет оценки и линии */
export const parseInfoLine = (line: string, sideToMove: 'w' | 'b'): EngineLine | null => {
  if (!line.startsWith('info ') || !/ pv /.test(line)) return null;
  const depth = /\bdepth (\d+)/.exec(line);
  const score = /\bscore (cp|mate) (-?\d+)/.exec(line);
  if (!depth || !score) return null;
  // Границы окна поиска — неточная оценка, ждём точную
  if (/\b(lowerbound|upperbound)\b/.test(line)) return null;
  const multipv = /\bmultipv (\d+)/.exec(line);
  const pv = / pv (.+)$/.exec(line);
  const sign = sideToMove === 'w' ? 1 : -1;
  const value = Number(score[2]) * sign;
  return {
    multipv: multipv ? Number(multipv[1]) : 1,
    depth: Number(depth[1]),
    ...(score[1] === 'cp' ? { scoreCp: value } : { mate: value }),
    pv: pv ? pv[1].trim().split(/\s+/) : [],
  };
};

/** '+1.50', '-0.80', '0.00', 'M3', '-M2' (с точки зрения белых) */
export const formatScore = (line: Pick<EngineLine, 'scoreCp' | 'mate'> | undefined | null): string => {
  if (!line) return '…';
  // mate 0 — мат уже на доске
  if (line.mate !== undefined) return line.mate > 0 ? `M${line.mate}` : line.mate < 0 ? `-M${-line.mate}` : '#';
  const pawns = (line.scoreCp ?? 0) / 100;
  return pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
};

/** Оценка для сравнения ходов: мат — «бесконечность», ближе мат — больше. С точки зрения color. */
export const scoreForSide = (line: Pick<EngineLine, 'scoreCp' | 'mate'>, color: 'w' | 'b'): number => {
  const sign = color === 'w' ? 1 : -1;
  if (line.mate !== undefined) {
    const m = line.mate * sign;
    return m > 0 ? 100000 - m : m < 0 ? -100000 - m : 0;
  }
  return (line.scoreCp ?? 0) * sign;
};

/** UCI-линию -> SAN с номерами ходов: '14. Bf5 g6 15. Bh3' */
export const pvToSan = (fen: string, pv: string[], maxMoves = 12): string => {
  try {
    const game = new Chess(fen);
    const parts: string[] = [];
    for (const uci of pv.slice(0, maxMoves)) {
      const moveNumber = game.moveNumber();
      const white = game.turn() === 'w';
      const move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
      if (!move) break;
      if (white) parts.push(`${moveNumber}. ${move.san}`);
      else parts.push(parts.length === 0 ? `${moveNumber}... ${move.san}` : move.san);
    }
    return parts.join(' ');
  } catch {
    return '';
  }
};

const sideOf = (fen: string): 'w' | 'b' => (fen.split(' ')[1] === 'b' ? 'b' : 'w');

// ---------------------------------------------------------------- движок

interface Search {
  fen: string;
  side: 'w' | 'b';
  depth: number;
  lines: Map<number, EngineLine>;
  options: AnalyzeOptions;
  resolve: (result: AnalysisResult) => void;
}

export class StockfishEngine {
  private worker: WorkerLike;
  private ready: Promise<void>;
  private resolveReady!: () => void;
  private search: Search | null = null;
  /** Сколько 'bestmove' прерванных поисков ещё придёт — до них все ответы чужие */
  private staleBestmoves = 0;
  private multiPv = 1;
  private generation = 0;
  /** Ждут, пока придут все 'bestmove' прерванных поисков */
  private idleWaiters: (() => void)[] = [];
  /** Владелец текущего (или ожидающего готовности) поиска */
  private owner: object | null = null;
  private terminated = false;
  name = 'Stockfish';
  error: string | null = null;

  constructor(createWorker: () => WorkerLike = () => new Worker(STOCKFISH_WORKER_URL) as unknown as WorkerLike) {
    this.ready = new Promise((resolve) => { this.resolveReady = resolve; });
    this.worker = createWorker();
    this.worker.onmessage = (event) => this.handle(String(event.data));
    this.worker.onerror = () => {
      this.error = 'Stockfish worker failed to load';
      this.finish(true);
      this.resolveReady(); // ожидающие analyze() не должны висеть вечно
    };
    this.worker.postMessage('uci');
  }

  /** Движок ответил readyok и принимает команды */
  isReady = false;

  private handle(line: string) {
    if (line.startsWith('id name ')) {
      this.name = line.slice('id name '.length).trim();
      return;
    }
    if (line === 'uciok') {
      this.worker.postMessage('isready');
      return;
    }
    if (line === 'readyok') {
      this.isReady = true;
      this.resolveReady();
      return;
    }
    if (line.startsWith('bestmove')) {
      if (this.staleBestmoves > 0) {
        this.staleBestmoves--;
        if (this.staleBestmoves === 0) this.wakeIdle();
        return;
      }
      const best = line.split(/\s+/)[1];
      this.finish(false, best && best !== '(none)' ? best : null);
      return;
    }
    if (this.staleBestmoves > 0 || !this.search || !line.startsWith('info ')) return;
    const parsed = parseInfoLine(line, this.search.side);
    if (!parsed) return;
    const { search } = this;
    search.lines.set(parsed.multipv, parsed);
    // Глубина «готова», когда пришла первая линия — для multipv 1 это каждая новая глубина
    if (parsed.multipv === 1 && parsed.depth > search.depth) search.depth = parsed.depth;
    search.options.onUpdate?.(this.snapshot(search, false, null));
  }

  private snapshot(search: Search, aborted: boolean, bestMove: string | null): AnalysisResult {
    const lines = [...search.lines.values()]
      .filter((l) => l.multipv <= (search.options.multiPv ?? 1))
      .sort((a, b) => a.multipv - b.multipv);
    return { fen: search.fen, depth: search.depth, lines, bestMove: bestMove ?? lines[0]?.pv[0] ?? null, aborted };
  }

  private finish(aborted: boolean, bestMove: string | null = null) {
    const { search } = this;
    if (!search) return;
    this.search = null;
    search.resolve(this.snapshot(search, aborted, bestMove));
  }

  private wakeIdle() {
    const waiters = this.idleWaiters;
    this.idleWaiters = [];
    waiters.forEach((wake) => wake());
  }

  /** Дождаться 'bestmove' прерванных поисков (не дольше timeoutMs: движок мог его не прислать) */
  private untilIdle(timeoutMs = 3000): Promise<void> {
    if (this.staleBestmoves === 0) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.staleBestmoves = 0;
        this.wakeIdle();
      }, timeoutMs);
      this.idleWaiters.push(() => { clearTimeout(timer); resolve(); });
    });
  }

  /** Прерывает текущий поиск; его промис разрешается частичным результатом (aborted: true) */
  stop() {
    this.generation++;
    if (this.search) {
      this.staleBestmoves++;
      this.worker.postMessage('stop');
      this.finish(true);
    }
  }

  /** Анализ позиции. Прерывает предыдущий поиск. */
  async analyze(fen: string, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
    this.stop();
    const generation = this.generation;
    this.owner = options.owner ?? null;
    await this.ready;
    await this.untilIdle();
    const empty: AnalysisResult = { fen, depth: 0, lines: [], bestMove: null, aborted: true };
    // Пока ждали готовности, пришёл новый запрос или движок закрыли
    if (generation !== this.generation || this.terminated || this.error) return empty;

    // Битый FEN может уронить asm-движок, а в позиции без ходов Stockfish 2018 не присылает
    // 'bestmove' вовсе — поиск висел бы вечно, а следующий stop() ждал бы его 'bestmove' и
    // заблокировал бы все ответы. Такие позиции решаем сами, без движка.
    let game: Chess;
    try {
      game = new Chess(fen);
    } catch {
      return empty;
    }
    if (game.isCheckmate() || game.isStalemate()) {
      const terminal = game.isCheckmate() ? 'checkmate' : 'stalemate';
      return {
        fen, depth: 0, bestMove: null, aborted: false, terminal,
        lines: [{ multipv: 1, depth: 0, pv: [], ...(terminal === 'checkmate' ? { mate: 0 } : { scoreCp: 0 }) }],
      };
    }

    const multiPv = Math.max(1, Math.min(5, options.multiPv ?? 1));
    if (multiPv !== this.multiPv) {
      this.worker.postMessage(`setoption name MultiPV value ${multiPv}`);
      this.multiPv = multiPv;
    }
    return new Promise((resolve) => {
      this.search = { fen, side: sideOf(fen), depth: 0, lines: new Map(), options: { ...options, multiPv }, resolve };
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${options.depth ?? 14}`);
    });
  }

  /**
   * Останавливает поиск, только если его запустил owner. Живой анализ при смене позиции
   * не должен прерывать чужой поиск (например, проверку решения, запущенную с той же страницы).
   */
  release(owner: object) {
    if (this.owner === owner) this.stop();
  }

  /** Останавливает поиск и уничтожает воркер — вызывать при размонтировании */
  terminate() {
    if (this.terminated) return;
    this.stop();
    this.terminated = true;
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.terminate();
    this.resolveReady();
    this.wakeIdle();
  }
}
