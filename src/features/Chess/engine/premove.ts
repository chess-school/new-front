// Предходы, как на Lichess (chessground): пока ходит соперник, игрок заранее ставит ход своей
// фигурой. Цели считаются по геометрии фигуры, без учёта занятости полей (к моменту хода
// позиция изменится): пешка — вперёд на 1–2 и наискосок, конь — прыжки, дальнобойные — лучи
// до края доски, король — на шаг и рокировка. Легальность проверяется в момент исполнения.

export interface Premove {
  from: string;
  to: string;
  promotion?: string;
}

type Board = Map<string, string>; // поле -> фигура 'wP', 'bK'…

const FILES = 'abcdefgh';
const sq = (f: number, r: number) => (f >= 0 && f < 8 && r >= 0 && r < 8 ? `${FILES[f]}${r + 1}` : null);
const coords = (square: string) => [FILES.indexOf(square[0]), Number(square[1]) - 1] as const;

/** Доска из FEN (только расстановка) */
export const boardFromFen = (fen: string): Board => {
  const board: Board = new Map();
  fen.split(' ')[0].split('/').forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += Number(ch); continue; }
      const color = ch === ch.toUpperCase() ? 'w' : 'b';
      board.set(sq(f, 7 - i)!, `${color}${ch.toUpperCase()}`);
      f++;
    }
  });
  return board;
};

/** Доска после цепочки предходов (фигуры просто переставляются) */
export const applyPremoves = (board: Board, premoves: Premove[]): Board => {
  const next = new Map(board);
  for (const p of premoves) {
    const piece = next.get(p.from);
    if (!piece) continue;
    next.delete(p.from);
    next.set(p.to, p.promotion ? `${piece[0]}${p.promotion.toUpperCase()}` : piece);
  }
  return next;
};

const RAYS = {
  B: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  R: [[1, 0], [-1, 0], [0, 1], [0, -1]],
};

/** Поля, куда фигура с поля square может пойти предходом */
export const premoveDests = (board: Board, square: string): string[] => {
  const piece = board.get(square);
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];
  const [f, r] = coords(square);
  const out = new Set<string>();
  const add = (s: string | null) => { if (s && board.get(s)?.[0] !== color) out.add(s); };

  if (type === 'P') {
    const dir = color === 'w' ? 1 : -1;
    add(sq(f, r + dir));
    if ((color === 'w' && r === 1) || (color === 'b' && r === 6)) add(sq(f, r + 2 * dir));
    add(sq(f - 1, r + dir));
    add(sq(f + 1, r + dir));
  } else if (type === 'N') {
    for (const [df, dr] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) add(sq(f + df, r + dr));
  } else if (type === 'K') {
    for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) if (df || dr) add(sq(f + df, r + dr));
    // Рокировка: король на исходном поле, ладья на месте
    const home = color === 'w' ? 0 : 7;
    if (f === 4 && r === home) {
      if (board.get(sq(7, home)!) === `${color}R`) out.add(sq(6, home)!);
      if (board.get(sq(0, home)!) === `${color}R`) out.add(sq(2, home)!);
    }
  } else {
    const dirs = type === 'B' ? RAYS.B : type === 'R' ? RAYS.R : [...RAYS.B, ...RAYS.R];
    for (const [df, dr] of dirs) {
      for (let k = 1; k < 8; k++) {
        const s = sq(f + df * k, r + dr * k);
        if (!s) break;
        add(s);
      }
    }
  }
  return [...out];
};

/** Ход пешки на последнюю горизонталь — нужен выбор фигуры (по умолчанию ферзь) */
export const isPromotionPremove = (board: Board, from: string, to: string) => {
  const piece = board.get(from);
  return piece?.[1] === 'P' && (to[1] === '8' || to[1] === '1');
};
