// Движок тренажёра «слепой памяти»: расставляет случайные фигуры (БЕЗ королей) и
// разыгрывает серию легальных ходов без взятий. Пользователь держит позицию в голове
// и отвечает на вопросы о ней.
//
// Почему СВОЙ генератор ходов, а не chess.js:
// в этом тренажёре на доске НЕТ королей, значит понятия шаха/мата/связки не существуют —
// ход легален, если он подчиняется только геометрии фигуры и приходит на пустое поле.
// chess.js требует валидный FEN с ровно одним королём каждого цвета и отфильтровал бы
// ходы из-за несуществующего здесь шаха. Поэтому генерация движения фигур реализована сама —
// это и проще, и точнее отражает правила тренажёра (только геометрия + пустое поле назначения,
// никаких взятий и превращений).

export type PieceType = 'q' | 'r' | 'b' | 'n' | 'p';
export type Color = 'w' | 'b';

export interface Piece {
  id: string;
  type: PieceType;
  color: Color;
  square: string;
}

export interface BlindfoldStep {
  pieceId: string;
  type: PieceType;
  color: Color;
  from: string;
  to: string;
}

export interface BlindfoldSession {
  initial: Piece[];
  steps: BlindfoldStep[];
  /** Итоговая позиция: поле → фигура, стоящая на нём после всех ходов */
  finalBySquare: Record<string, Piece>;
}

export interface GenerateOptions {
  pieceCount: number;
  moveCount: number;
  /** Источник случайности [0,1); по умолчанию Math.random. Для тестов — makeRng(seed) */
  rng?: () => number;
}

export interface BlindfoldQuestion {
  kind: 'where-piece' | 'what-on-square';
  /** Фигура, о которой спрашиваем (для 'where-piece') */
  piece?: Piece;
  /** Поле, о котором спрашиваем (для 'what-on-square'); у 'where-piece' дублирует answerSquare */
  square: string;
  answerSquare?: string;
  answerPiece?: Piece;
}

// ---------------------------------------------------------------- ПСЕВДОСЛУЧАЙНОСТЬ

/** Сидируемый ГПСЧ mulberry32 — детерминированный поток [0,1) для воспроизводимых тестов */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng: () => number, n: number) => Math.floor(rng() * n);
const pick = <T,>(rng: () => number, arr: T[]): T => arr[randInt(rng, arr.length)];

// ---------------------------------------------------------------- ДОСКА / КООРДИНАТЫ

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const PIECE_TYPES: PieceType[] = ['q', 'r', 'b', 'n', 'p'];
const COLORS: Color[] = ['w', 'b'];

/** Все 64 поля 'a1'..'h8' */
const ALL_SQUARES: string[] = (() => {
  const out: string[] = [];
  for (let r = 1; r <= 8; r++) for (const f of FILES) out.push(`${f}${r}`);
  return out;
})();

/** Файл (0..7) и ранг (1..8) поля */
const fileIndex = (sq: string) => FILES.indexOf(sq[0]);
const rankOf = (sq: string) => Number(sq[1]);
const squareAt = (fileIdx: number, rank: number): string | null =>
  fileIdx < 0 || fileIdx > 7 || rank < 1 || rank > 8 ? null : `${FILES[fileIdx]}${rank}`;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(n)));

// ---------------------------------------------------------------- ГЕНЕРАЦИЯ ХОДОВ

/** Направления-«лучи» скользящих фигур: [dFile, dRank] */
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const QUEEN_DIRS = [...ROOK_DIRS, ...BISHOP_DIRS];
/** Прыжки коня */
const KNIGHT_DELTAS = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];

/**
 * Легальные поля НАЗНАЧЕНИЯ фигуры БЕЗ взятий из позиции `occupied` (поле→фигура).
 * Только геометрия + пустое поле; скользящие не перепрыгивают занятые; пешка — только вперёд,
 * двойной ход лишь с начальной горизонтали, превращение исключено (ход на последнюю горизонталь не выдаётся).
 */
export function legalDestinations(piece: Piece, occupied: Record<string, Piece>): string[] {
  const dests: string[] = [];
  const fIdx = fileIndex(piece.square);
  const rank = rankOf(piece.square);
  const isEmpty = (sq: string) => !occupied[sq];

  if (piece.type === 'p') {
    const dir = piece.color === 'w' ? 1 : -1;
    const lastRank = piece.color === 'w' ? 8 : 1;
    const startRank = piece.color === 'w' ? 2 : 7;
    const one = squareAt(fIdx, rank + dir);
    // Один шаг вперёд (но не на последнюю горизонталь — превращение исключаем)
    if (one && rankOf(one) !== lastRank && isEmpty(one)) {
      dests.push(one);
      // Двойной шаг только со стартовой горизонтали и если оба поля пусты
      if (rank === startRank) {
        const two = squareAt(fIdx, rank + 2 * dir);
        if (two && isEmpty(two)) dests.push(two);
      }
    }
    return dests;
  }

  if (piece.type === 'n') {
    for (const [df, dr] of KNIGHT_DELTAS) {
      const sq = squareAt(fIdx + df, rank + dr);
      if (sq && isEmpty(sq)) dests.push(sq);
    }
    return dests;
  }

  // Скользящие: q/r/b — идём по лучам до первого занятого поля (само занятое не берём — взятий нет)
  const dirs = piece.type === 'r' ? ROOK_DIRS : piece.type === 'b' ? BISHOP_DIRS : QUEEN_DIRS;
  for (const [df, dr] of dirs) {
    let f = fIdx + df;
    let r = rank + dr;
    let sq = squareAt(f, r);
    while (sq && isEmpty(sq)) {
      dests.push(sq);
      f += df;
      r += dr;
      sq = squareAt(f, r);
    }
  }
  return dests;
}

// ---------------------------------------------------------------- СЕССИЯ

/**
 * Детерминированная сессия: pieceCount фигур на разных полях + moveCount легальных ходов без взятий.
 * pieceCount зажимается в [4,10], moveCount — в [10,50]. Если вдруг ни одна фигура не может ходить,
 * генерация останавливается раньше (для указанных диапазонов места на доске всегда хватает).
 */
export function generateSession(opts: GenerateOptions): BlindfoldSession {
  const rng = opts.rng ?? Math.random;
  const pieceCount = clamp(opts.pieceCount, 4, 10);
  const moveCount = clamp(opts.moveCount, 10, 50);

  // --- Расстановка на РАЗНЫХ полях ---
  const freeSquares = [...ALL_SQUARES];
  const initial: Piece[] = [];
  const occupied: Record<string, Piece> = {};
  for (let i = 0; i < pieceCount; i++) {
    const sqIdx = randInt(rng, freeSquares.length);
    const square = freeSquares.splice(sqIdx, 1)[0];
    let type = pick(rng, PIECE_TYPES);
    const color = pick(rng, COLORS);
    // Пешка на последней для своего цвета горизонтали не имела бы ходов и была бы «застрявшей»
    // (превращения нет) — заменяем её тип, чтобы расстановка не содержала мёртвых пешек.
    const lastRank = color === 'w' ? 8 : 1;
    if (type === 'p' && rankOf(square) === lastRank) type = 'q';
    const piece: Piece = { id: `p${i}`, type, color, square };
    initial.push(piece);
    occupied[square] = piece;
  }

  // --- Разыгрывание ходов ---
  // live: поле → фигура (мутируемая копия текущей позиции). У каждой фигуры поле обновляем.
  const live: Record<string, Piece> = {};
  const pieces: Piece[] = initial.map((p) => ({ ...p }));
  for (const p of pieces) live[p.square] = p;

  const steps: BlindfoldStep[] = [];
  for (let m = 0; m < moveCount; m++) {
    // Кандидаты — фигуры, у которых есть хоть один легальный ход без взятия
    const movable = pieces.filter((p) => legalDestinations(p, live).length > 0);
    if (movable.length === 0) break; // тупик — останавливаемся раньше
    const piece = pick(rng, movable);
    const dests = legalDestinations(piece, live);
    const to = pick(rng, dests);
    const from = piece.square;

    steps.push({ pieceId: piece.id, type: piece.type, color: piece.color, from, to });
    // Применяем ход: освобождаем старое поле, занимаем новое
    delete live[from];
    piece.square = to;
    live[to] = piece;
  }

  // Итоговая позиция — снимок (копии, чтобы никто не мутировал сессию)
  const finalBySquare: Record<string, Piece> = {};
  for (const p of pieces) finalBySquare[p.square] = { ...p };

  return { initial, steps, finalBySquare };
}

// ---------------------------------------------------------------- ВОПРОСЫ

/**
 * Вопрос по итоговой позиции.
 * 'where-piece': «где стоит эта фигура?» — предпочитаем фигуру с уникальной парой (тип,цвет),
 *   чтобы ответ был однозначным; если уникальных нет — берём любую.
 * 'what-on-square': «что стоит на этом поле?».
 */
export function buildQuestion(session: BlindfoldSession, rng: () => number = Math.random): BlindfoldQuestion {
  const squares = Object.keys(session.finalBySquare);
  const pieces = squares.map((sq) => session.finalBySquare[sq]);

  const kind: BlindfoldQuestion['kind'] = rng() < 0.5 ? 'where-piece' : 'what-on-square';

  if (kind === 'where-piece') {
    // Уникальные по (тип,цвет) — ответ однозначен
    const counts = new Map<string, number>();
    for (const p of pieces) {
      const key = `${p.color}${p.type}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const unique = pieces.filter((p) => counts.get(`${p.color}${p.type}`) === 1);
    const piece = unique.length ? pick(rng, unique) : pick(rng, pieces);
    return {
      kind,
      piece: { ...piece },
      square: piece.square,
      answerSquare: piece.square,
    };
  }

  // what-on-square
  const square = pick(rng, squares);
  const piece = session.finalBySquare[square];
  return { kind, square, answerPiece: { ...piece } };
}

// ---------------------------------------------------------------- ОПИСАНИЕ (RU)

const PIECE_NAMES_RU: Record<PieceType, string> = {
  q: 'Ферзь',
  r: 'Ладья',
  b: 'Слон',
  n: 'Конь',
  p: 'Пешка',
};

/** Человекочитаемое описание хода по-русски, напр. «Конь b1 → c3» */
export function describeStep(step: BlindfoldStep): string {
  return `${PIECE_NAMES_RU[step.type]} ${step.from} → ${step.to}`;
}
