import { Chess } from 'chess.js';

// Дерево ходов эталонного решения: главная линия — children[0], остальные дети — варианты
export interface MoveNode {
  id: number;
  san: string;
  /** Позиция после хода */
  fen: string;
  /** Номер полухода от начальной позиции (0 — первый ход решения) */
  ply: number;
  moveNumber: number;
  color: 'w' | 'b';
  nags: string[];
  commentBefore?: string;
  comment?: string;
  children: MoveNode[];
  parent: MoveNode | null;
}

export interface MoveTree {
  startFen: string;
  /** Первые ходы: [0] — главная линия, остальные — альтернативы первому ходу */
  roots: MoveNode[];
  /** Комментарий до первого хода */
  comment?: string;
}

export interface ParseResult {
  tree: MoveTree;
  /** Первая ошибка разбора; дерево содержит всё, что удалось разобрать до неё */
  error?: string;
}

const NAG_SYMBOLS: Record<string, string> = {
  $1: '!', $2: '?', $3: '!!', $4: '??', $5: '!?', $6: '?!',
  $10: '=', $13: '∞', $14: '⩲', $15: '⩱', $16: '±', $17: '∓', $18: '+−', $19: '−+',
};
const SUFFIX_TO_NAG: Record<string, string> = { '!': '$1', '?': '$2', '!!': '$3', '??': '$4', '!?': '$5', '?!': '$6' };

export const nagToSymbol = (nag: string) => NAG_SYMBOLS[nag] ?? '';

type Token =
  | { type: 'comment'; value: string }
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'nag'; value: string }
  | { type: 'san'; value: string };

const tokenize = (text: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '{') {
      const end = text.indexOf('}', i + 1);
      const stop = end === -1 ? text.length : end;
      tokens.push({ type: 'comment', value: text.slice(i + 1, stop).trim() });
      i = stop + 1;
      continue;
    }
    if (ch === ';') { // комментарий до конца строки
      const end = text.indexOf('\n', i);
      i = end === -1 ? text.length : end + 1;
      continue;
    }
    if (ch === '(') { tokens.push({ type: 'open' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'close' }); i++; continue; }

    const match = /^[^\s{}();]+/.exec(text.slice(i));
    const word = match ? match[0] : ch;
    i += word.length;

    if (/^\$\d+$/.test(word)) { tokens.push({ type: 'nag', value: word }); continue; }
    if (/^(\*|1-0|0-1|1\/2-1\/2)$/.test(word)) continue;           // результат партии
    const san = word.replace(/^\d+\.+/, '');                        // «14.», «14...», «14.Bf5»
    if (!san || /^\d+$/.test(san)) continue;
    if (/^[!?]+$/.test(san)) {                                       // «Bf5 !» отдельно
      if (SUFFIX_TO_NAG[san]) tokens.push({ type: 'nag', value: SUFFIX_TO_NAG[san] });
      continue;
    }
    const suffix = /[!?]+$/.exec(san);
    tokens.push({ type: 'san', value: suffix ? san.slice(0, -suffix[0].length) : san });
    if (suffix && SUFFIX_TO_NAG[suffix[0]]) tokens.push({ type: 'nag', value: SUFFIX_TO_NAG[suffix[0]] });
  }
  return tokens;
};

/** Разбирает movetext решения от позиции startFen, проверяя легальность каждого хода. */
export const parseSolution = (startFen: string, movetext: string): ParseResult => {
  const tree: MoveTree = { startFen, roots: [] };
  let nextId = 1;

  try {
    new Chess(startFen);
  } catch (e) {
    return { tree, error: (e as Error).message };
  }

  // last — последний сделанный в текущей линии ход (null — начальная позиция)
  let last: MoveNode | null = null;
  // Позиция, от которой начинается текущая линия-вариант, нужна только при last === null
  const stack: (MoveNode | null)[] = [];
  let pendingComment: string | undefined;

  const appendComment = (text: string) => {
    if (last) last.comment = last.comment ? `${last.comment} ${text}` : text;
    else pendingComment = pendingComment ? `${pendingComment} ${text}` : text;
  };

  for (const token of tokenize(movetext)) {
    switch (token.type) {
      case 'comment':
        if (token.value) appendComment(token.value);
        break;
      case 'nag':
        if (last) last.nags.push(token.value);
        break;
      case 'open': {
        // Вариант — альтернатива последнему ходу: начинается из позиции до него
        if (!last) return { tree, error: 'Variation without a preceding move' };
        stack.push(last);
        last = last.parent;
        break;
      }
      case 'close': {
        if (stack.length === 0) return { tree, error: 'Unbalanced ")"' };
        last = stack.pop() ?? null;
        pendingComment = undefined;
        break;
      }
      case 'san': {
        const game = new Chess(last ? last.fen : startFen);
        let move;
        try {
          move = game.move(token.value);
        } catch {
          move = null;
        }
        if (!move) {
          const where = last ? `after ${last.moveNumber}${last.color === 'w' ? '.' : '...'} ${last.san}` : 'in the start position';
          return { tree, error: `Illegal move "${token.value}" ${where}` };
        }
        const plyBase = last ? last.ply + 1 : 0;
        const node: MoveNode = {
          id: nextId++,
          san: move.san,
          fen: game.fen(),
          ply: plyBase,
          moveNumber: Number((last ? last.fen : startFen).split(' ')[5]) || 1,
          color: move.color,
          nags: [],
          children: [],
          parent: last,
        };
        if (pendingComment) {
          if (!last && tree.roots.length === 0 && stack.length === 0) tree.comment = pendingComment;
          else node.commentBefore = pendingComment;
          pendingComment = undefined;
        }
        (last ? last.children : tree.roots).push(node);
        last = node;
        break;
      }
    }
  }

  if (pendingComment && tree.roots.length === 0) tree.comment = pendingComment;
  if (stack.length > 0) return { tree, error: 'Unclosed "("' };
  return { tree };
};

export const getMainline = (tree: MoveTree): MoveNode[] => {
  const line: MoveNode[] = [];
  let node: MoveNode | undefined = tree.roots[0];
  while (node) {
    line.push(node);
    node = node.children[0];
  }
  return line;
};

export const formatMoveNumber = (node: MoveNode) =>
  node.color === 'w' ? `${node.moveNumber}.` : `${node.moveNumber}...`;

export const sideToMove = (fen: string): 'w' | 'b' => (fen.split(' ')[1] === 'b' ? 'b' : 'w');

/** Меняет очередь хода в FEN; взятие на проходе сбрасывается, т.к. становится невалидным */
export const setSideToMove = (fen: string, color: 'w' | 'b'): string => {
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) return fen;
  parts[1] = color;
  parts[3] = '-';
  return parts.join(' ');
};

export const validateFen = (fen: string): string | null => {
  try {
    new Chess(fen);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};
