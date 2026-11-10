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

// ---------------------------------------------------------------- РАССТАНОВКА

/**
 * Случайная расстановка pieceCount фигур (БЕЗ королей) на РАЗНЫХ полях.
 * pieceCount зажимается в [4,10]. Пешка на последней для своего цвета горизонтали стала бы
 * «мёртвой» (ходов нет, превращение исключено) — её тип меняем на ферзя.
 * Порядок обращений к rng (для каждой фигуры: поле → тип → цвет) стабилен — расстановка детерминирована.
 */
export function placePieces(pieceCount: number, rng: () => number): Piece[] {
  const n = clamp(pieceCount, 4, 10);
  const freeSquares = [...ALL_SQUARES];
  const pieces: Piece[] = [];
  for (let i = 0; i < n; i++) {
    const sqIdx = randInt(rng, freeSquares.length);
    const square = freeSquares.splice(sqIdx, 1)[0];
    let type = pick(rng, PIECE_TYPES);
    const color = pick(rng, COLORS);
    const lastRank = color === 'w' ? 8 : 1;
    if (type === 'p' && rankOf(square) === lastRank) type = 'q';
    pieces.push({ id: `p${i}`, type, color, square });
  }
  return pieces;
}

/**
 * Фигуры для режима ЛИНИИ: только настоящие «двигающиеся» фигуры со сменой вектора —
 * конь, ладья, слон, ферзь (БЕЗ пешек: пешка почти всегда «мёртвая» и неинтересна, и БЕЗ королей).
 */
export const LINE_PIECE_TYPES: PieceType[] = ['n', 'r', 'b', 'q'];

/**
 * Расстановка для линии: СБАЛАНСИРОВАННЫЙ состав по кругу конь→ладья→слон→ферзь. Первые четыре
 * фигуры дают обязательный набор n/r/b/q (нельзя ответить «на глаз» — надо знать, где какая),
 * дальше набор повторяется по кругу, так что перекоса (например, трёх ферзей) не бывает.
 * Цвета случайны, поля различны.
 */
export function placeLinePieces(pieceCount: number, rng: () => number): Piece[] {
  const n = clamp(pieceCount, 4, 10);
  const freeSquares = [...ALL_SQUARES];
  const pieces: Piece[] = [];
  for (let i = 0; i < n; i++) {
    const sqIdx = randInt(rng, freeSquares.length);
    const square = freeSquares.splice(sqIdx, 1)[0];
    const type = LINE_PIECE_TYPES[i % LINE_PIECE_TYPES.length];
    const color = pick(rng, COLORS);
    pieces.push({ id: `p${i}`, type, color, square });
  }
  return pieces;
}

/** Снимок позиции: поле → фигура, стоящая на нём */
const indexBySquare = (pieces: Piece[]): Record<string, Piece> => {
  const map: Record<string, Piece> = {};
  for (const p of pieces) map[p.square] = p;
  return map;
};

// ---------------------------------------------------------------- СЕССИЯ

/**
 * Детерминированная сессия: pieceCount фигур на разных полях + moveCount легальных ходов без взятий.
 * pieceCount зажимается в [4,10], moveCount — в [10,50]. Если вдруг ни одна фигура не может ходить,
 * генерация останавливается раньше (для указанных диапазонов места на доске всегда хватает).
 */
export function generateSession(opts: GenerateOptions): BlindfoldSession {
  const rng = opts.rng ?? Math.random;
  const moveCount = clamp(opts.moveCount, 10, 50);

  // --- Расстановка на РАЗНЫХ полях ---
  const initial = placePieces(opts.pieceCount, rng);

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

// ---------------------------------------------------------------- ПАЗЛ «ОДНА ФИГУРА → ПОЛЕ»

/**
 * Пазл слепой видимости: статичная позиция и ПУСТОЕ поле-цель, на которое может легально пойти
 * РОВНО ОДНА фигура (без взятий). Ученик, держа позицию в голове, называет эту фигуру —
 * указывает поле, где она стоит (`answerSquare`).
 */
export interface BlindfoldPuzzle {
  pieces: Piece[];
  bySquare: Record<string, Piece>;
  /** Названное поле-цель (пустое) */
  target: string;
  /** Поле, на котором стоит единственная достающая до цели фигура — правильный ответ */
  answerSquare: string;
  answerPiece: Piece;
}

export interface GeneratePuzzleOptions {
  pieceCount: number;
  rng?: () => number;
  /** Сколько раз пробовать случайную расстановку, прежде чем взять детерминированный фолбэк */
  maxAttempts?: number;
}

/**
 * Для позиции `bySquare` — карта: пустое поле → список фигур, которые могут легально пойти туда
 * (без взятий). Поля, на которые никто не ходит, в карте отсутствуют.
 */
export function reachMap(bySquare: Record<string, Piece>): Map<string, Piece[]> {
  const reach = new Map<string, Piece[]>();
  for (const sq of Object.keys(bySquare)) {
    const piece = bySquare[sq];
    for (const dest of legalDestinations(piece, bySquare)) {
      const arr = reach.get(dest);
      if (arr) arr.push(piece);
      else reach.set(dest, [piece]);
    }
  }
  return reach;
}

/**
 * Детерминированный фолбэк, если случайная расстановка maxAttempts раз не дала поля с единственной
 * достающей фигурой (практически не случается для pieceCount≥4). Конь на d4 — единственный, кто
 * достаёт до c6; остальные — белые пешки, не бьющие (ходов на c6 ни у кого больше нет).
 */
function fallbackPuzzle(pieceCount: number): BlindfoldPuzzle {
  const n = clamp(pieceCount, 4, 10);
  const pawnSquares = ['a2', 'b2', 'e2', 'f2', 'g2', 'h2', 'a3', 'h3', 'd2'];
  const pieces: Piece[] = [{ id: 'p0', type: 'n', color: 'w', square: 'd4' }];
  for (let i = 1; i < n; i++) {
    pieces.push({ id: `p${i}`, type: 'p', color: 'w', square: pawnSquares[i - 1] });
  }
  const answerPiece = pieces[0];
  return {
    pieces,
    bySquare: indexBySquare(pieces),
    target: 'c6',
    answerSquare: 'd4',
    answerPiece: { ...answerPiece },
  };
}

/**
 * Список ВСЕХ пустых полей, достижимых РОВНО ОДНОЙ фигурой (без взятий), и этих фигур.
 * Это пул вопросов для фиксированной позиции: «какая фигура может пойти на это поле?».
 */
export interface UniqueTarget { target: string; piece: Piece; }

export function uniqueReachTargets(bySquare: Record<string, Piece>): UniqueTarget[] {
  const reach = reachMap(bySquare);
  const out: UniqueTarget[] = [];
  for (const [sq, ps] of reach) if (ps.length === 1) out.push({ target: sq, piece: { ...ps[0] } });
  return out;
}

/**
 * Одна ПОЗИЦИЯ для всей серии: расстановка + список полей, каждое из которых достижимо ровно
 * одной фигурой. По этой позиции задаётся много вопросов подряд (позиция не меняется).
 */
export interface BlindfoldPosition {
  pieces: Piece[];
  bySquare: Record<string, Piece>;
  targets: UniqueTarget[];
}

/**
 * Сгенерировать позицию для серии: случайная расстановка, у которой есть хотя бы одно поле,
 * достижимое ровно одной фигурой (чем больше таких полей — тем разнообразнее вопросы).
 * После maxAttempts неудач берётся детерминированный фолбэк.
 */
export function generatePosition(opts: GeneratePuzzleOptions): BlindfoldPosition {
  const rng = opts.rng ?? Math.random;
  const pieceCount = clamp(opts.pieceCount, 4, 10);
  const maxAttempts = opts.maxAttempts ?? 200;

  let best: BlindfoldPosition | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pieces = placePieces(pieceCount, rng);
    const bySquare = indexBySquare(pieces);
    const targets = uniqueReachTargets(bySquare);
    if (targets.length === 0) continue;
    // Берём позицию с наибольшим числом уникальных целей (разнообразнее серия)
    if (!best || targets.length > best.targets.length) best = { pieces, bySquare, targets };
    if (best.targets.length >= 6) break; // достаточно разнообразия — не крутим дальше
  }
  if (best) return best;

  const fb = fallbackPuzzle(pieceCount);
  return { pieces: fb.pieces, bySquare: fb.bySquare, targets: uniqueReachTargets(fb.bySquare) };
}

// ---------------------------------------------------------------- ЛИНИЯ (эволюция позиции)

/**
 * Один ход линии: названное поле-цель и ЕДИНСТВЕННАЯ фигура, которая может туда пойти,
 * в позиции НА ЭТОМ ходу (инвариант — ровно одна). После ответа фигура идёт `from → target`,
 * и следующий вопрос задаётся уже по изменившейся позиции.
 */
export interface LineStep {
  target: string;
  pieceType: PieceType;
  pieceColor: Color;
  from: string;
}

export interface BlindfoldLine {
  /** Стартовая расстановка (для фазы запоминания и воспроизведения) */
  initial: Piece[];
  /** Последовательность ходов; на каждом цель достижима ровно одной фигурой */
  steps: LineStep[];
}

export interface GenerateLineOptions {
  pieceCount: number;
  maxMoves: number;
  rng?: () => number;
}

/**
 * Сгенерировать ЛИНИЮ: на каждом ходу выбираем поле, достижимое РОВНО ОДНОЙ фигурой (без взятий),
 * фиксируем вопрос и двигаем эту фигуру туда — позиция меняется. Так инвариант «на каждом ходу ровно
 * одна фигура достаёт до цели» выполняется ПО ПОСТРОЕНИЮ. Если уникальных целей не осталось — линия
 * обрывается раньше maxMoves.
 */
export function generateLine(opts: GenerateLineOptions): BlindfoldLine {
  const rng = opts.rng ?? Math.random;
  const pieceCount = clamp(opts.pieceCount, 4, 10);
  const maxMoves = clamp(opts.maxMoves, 1, 200);

  const pieces = placeLinePieces(pieceCount, rng);
  const live: Record<string, Piece> = {};
  for (const p of pieces) live[p.square] = p; // те же объекты — двигаем их по ходу
  const initial = pieces.map((p) => ({ ...p }));

  const MAX_SAME_RUN = 2; // максимум ходов подряд одной фигурой — дальше заставляем сменить вектор

  const steps: LineStep[] = [];
  let lastId: string | null = null; // кто ходил в прошлый раз
  let run = 0;                       // сколько ходов подряд ходит lastId
  for (let m = 0; m < maxMoves; m++) {
    const reach = reachMap(live);
    // Кандидаты: поля, достижимые РОВНО одной фигурой (инвариант задания)
    const unique: Array<[string, Piece]> = [];
    for (const [sq, ps] of reach) if (ps.length === 1) unique.push([sq, ps[0]]);
    if (unique.length === 0) break;

    // Смена вектора: если есть ход ДРУГОЙ фигурой — всегда берём его (нельзя «вести» одну фигуру).
    const diff = lastId === null ? unique : unique.filter(([, p]) => p.id !== lastId);
    let pool: Array<[string, Piece]>;
    if (diff.length > 0) {
      pool = diff;
    } else {
      // Сменить фигуру нельзя (уникальную цель даёт только прошлая фигура).
      if (run >= MAX_SAME_RUN) break; // не тянем одну фигуру дольше лимита — обрываем линию
      pool = unique;
    }

    const [target, piece] = pick(rng, pool);
    steps.push({ target, pieceType: piece.type, pieceColor: piece.color, from: piece.square });
    // применяем ход
    delete live[piece.square];
    piece.square = target;
    live[target] = piece;
    run = piece.id === lastId ? run + 1 : 1;
    lastId = piece.id;
  }
  return { initial, steps };
}

/**
 * Детерминированный БЛОК заранее подготовленных линий: сканируем сиды по порядку и берём первые
 * `count` линий длиной не меньше `minMoves`. Результат зависит только от входа — его инвариант
 * проверяется тестами (на каждом ходу каждой линии до цели достаёт ровно одна фигура).
 */
export function buildLineBlock(opts: {
  pieceCount: number; count: number; minMoves: number; maxMoves: number; maxSeeds?: number;
}): BlindfoldLine[] {
  const { pieceCount, count, minMoves, maxMoves } = opts;
  const maxSeeds = opts.maxSeeds ?? 20000;
  const lines: BlindfoldLine[] = [];
  for (let seed = 1; seed <= maxSeeds && lines.length < count; seed++) {
    const line = generateLine({ pieceCount, maxMoves, rng: makeRng(seed) });
    if (line.steps.length >= minMoves) lines.push(line);
  }
  return lines;
}

/**
 * Сгенерировать пазл: случайная позиция, у которой есть ПУСТОЕ поле, достижимое РОВНО ОДНОЙ фигурой.
 * Такое поле выбирается целью, а его единственная достающая фигура — ответом.
 */
export function generatePuzzle(opts: GeneratePuzzleOptions): BlindfoldPuzzle {
  const rng = opts.rng ?? Math.random;
  const pieceCount = clamp(opts.pieceCount, 4, 10);
  const maxAttempts = opts.maxAttempts ?? 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pieces = placePieces(pieceCount, rng);
    const bySquare = indexBySquare(pieces);
    const reach = reachMap(bySquare);
    // Поля, на которые может пойти ровно одна фигура
    const unique: Array<[string, Piece]> = [];
    for (const [sq, ps] of reach) if (ps.length === 1) unique.push([sq, ps[0]]);
    if (unique.length === 0) continue;
    const [target, answerPiece] = pick(rng, unique);
    return {
      pieces,
      bySquare,
      target,
      answerSquare: answerPiece.square,
      answerPiece: { ...answerPiece },
    };
  }
  return fallbackPuzzle(pieceCount);
}
