// Дерево вариантов партии, как на Lichess: у каждой позиции — список продолжений,
// children[0] — главное, остальные — варианты. Ход из любой позиции, которого ещё нет
// среди продолжений, создаёт новую ветку; существующий — просто переход по нему.
// Все операции чистые: возвращают новое дерево, старое не меняется (удобно для React-состояния).

import { Chess } from 'chess.js';
import { parseSolution, MoveNode } from '@/features/Digitizer/utils/pgnTree';

export interface TreeNode {
  id: string;
  parentId: string | null;
  /** '' у корня (начальная позиция) */
  san: string;
  uci: string;
  /** Позиция после хода (у корня — начальная) */
  fen: string;
  /** Номер полухода от начальной позиции: 0 — корень */
  ply: number;
  /** Номер хода в нотации и чей это был ход */
  moveNumber: number;
  color: 'w' | 'b';
  /** Глифы PGN: '$1' (!), '$2' (?), '$3' (!!), '$4' (??), '$5' (!?), '$6' (?!) и т. д. */
  nags: string[];
  comment?: string;
  children: string[];
}

export interface GameTree {
  rootId: string;
  nodes: Record<string, TreeNode>;
  nextId: number;
}

export const ROOT_ID = 'root';
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Глифы оценки хода — взаимоисключающие: у хода может быть только один */
export const MOVE_GLYPHS = [
  { nag: '$1', symbol: '!', key: 'good' },
  { nag: '$3', symbol: '!!', key: 'brilliant' },
  { nag: '$5', symbol: '!?', key: 'interesting' },
  { nag: '$6', symbol: '?!', key: 'dubious' },
  { nag: '$2', symbol: '?', key: 'mistake' },
  { nag: '$4', symbol: '??', key: 'blunder' },
] as const;
const MOVE_GLYPH_NAGS = new Set<string>(MOVE_GLYPHS.map((g) => g.nag));

const fenSide = (fen: string): 'w' | 'b' => (fen.split(' ')[1] === 'b' ? 'b' : 'w');
const fenMoveNumber = (fen: string) => Number(fen.split(' ')[5]) || 1;

export const createTree = (startFen: string = START_FEN): GameTree => ({
  rootId: ROOT_ID,
  nextId: 1,
  nodes: {
    [ROOT_ID]: {
      id: ROOT_ID, parentId: null, san: '', uci: '', fen: new Chess(startFen).fen(), ply: 0,
      moveNumber: fenMoveNumber(startFen), color: fenSide(startFen) === 'w' ? 'b' : 'w', nags: [], children: [],
    },
  },
});

export const startFenOf = (tree: GameTree) => tree.nodes[tree.rootId].fen;

const withNode = (tree: GameTree, id: string, patch: Partial<TreeNode>): GameTree => ({
  ...tree,
  nodes: { ...tree.nodes, [id]: { ...tree.nodes[id], ...patch } },
});

export type MoveInput = string | { from: string; to: string; promotion?: string };

/**
 * Ход из позиции parentId. Если такое продолжение уже есть — возвращает его (без изменений
 * дерева), иначе добавляет новую ветку (первое продолжение становится главным).
 * null — ход нелегален.
 */
export const addMove = (tree: GameTree, parentId: string, input: MoveInput): { tree: GameTree; id: string } | null => {
  const parent = tree.nodes[parentId];
  if (!parent) return null;
  const game = new Chess(parent.fen);
  let move;
  try {
    move = typeof input === 'string'
      ? game.move(input)
      : game.move({ from: input.from, to: input.to, promotion: input.promotion ?? 'q' });
  } catch {
    return null;
  }
  const uci = `${move.from}${move.to}${move.promotion ?? ''}`;
  const existing = parent.children.find((c) => tree.nodes[c].uci === uci);
  if (existing) return { tree, id: existing };

  const id = `n${tree.nextId}`;
  const node: TreeNode = {
    id, parentId, san: move.san, uci, fen: game.fen(), ply: parent.ply + 1,
    moveNumber: fenMoveNumber(parent.fen), color: move.color, nags: [], children: [],
  };
  return {
    id,
    tree: {
      ...tree,
      nextId: tree.nextId + 1,
      nodes: { ...tree.nodes, [id]: node, [parentId]: { ...parent, children: [...parent.children, id] } },
    },
  };
};

/** Путь от корня до узла (включая оба) */
export const pathTo = (tree: GameTree, id: string): TreeNode[] => {
  const path: TreeNode[] = [];
  let node: TreeNode | undefined = tree.nodes[id];
  while (node) {
    path.unshift(node);
    node = node.parentId ? tree.nodes[node.parentId] : undefined;
  }
  return path;
};

/** Главное продолжение после узла: children[0], children[0].children[0], … */
export const continuation = (tree: GameTree, id: string): TreeNode[] => {
  const line: TreeNode[] = [];
  let next = tree.nodes[id]?.children[0];
  while (next) {
    line.push(tree.nodes[next]);
    next = tree.nodes[next].children[0];
  }
  return line;
};

/** Узел лежит на главной линии партии (все предки — первые продолжения) */
export const isMainline = (tree: GameTree, id: string): boolean =>
  pathTo(tree, id).every((n) => !n.parentId || tree.nodes[n.parentId].children[0] === n.id);

/** Ближайший к узлу (включая его) предок, который не главное продолжение своего родителя — начало варианта */
const variationHead = (tree: GameTree, id: string): TreeNode | null => {
  let node: TreeNode | undefined = tree.nodes[id];
  while (node && node.parentId) {
    if (tree.nodes[node.parentId].children[0] !== node.id) return node;
    node = tree.nodes[node.parentId];
  }
  return null;
};

/** «Поднять вариант» на один уровень: начало варианта становится главным продолжением своего родителя */
export const promoteVariation = (tree: GameTree, id: string): GameTree => {
  const head = variationHead(tree, id);
  if (!head || !head.parentId) return tree;
  const parent = tree.nodes[head.parentId];
  return withNode(tree, parent.id, { children: [head.id, ...parent.children.filter((c) => c !== head.id)] });
};

/** «Сделать главным вариантом»: поднимать, пока линия узла не станет главной линией партии */
export const makeMainline = (tree: GameTree, id: string): GameTree => {
  let next = tree;
  for (let guard = 0; guard < 500 && !isMainline(next, id); guard++) next = promoteVariation(next, id);
  return next;
};

/** Удалить узел со всем продолжением. Возвращает дерево и родителя — туда переходит курсор */
export const deleteBranch = (tree: GameTree, id: string): { tree: GameTree; parentId: string } => {
  const node = tree.nodes[id];
  if (!node || !node.parentId) return { tree, parentId: tree.rootId };
  const nodes = { ...tree.nodes };
  const drop = (nid: string) => {
    nodes[nid].children.forEach(drop);
    delete nodes[nid];
  };
  drop(id);
  const parent = nodes[node.parentId];
  nodes[parent.id] = { ...parent, children: parent.children.filter((c) => c !== id) };
  return { tree: { ...tree, nodes }, parentId: parent.id };
};

/**
 * «Подняться на уровень вверх»: выйти из варианта в позицию, где он ответвляется от
 * родительской линии. На главной линии — null (выше подниматься некуда).
 */
export const exitVariation = (tree: GameTree, id: string): string | null => {
  const head = variationHead(tree, id);
  return head?.parentId ?? null;
};

/** Поставить/снять глиф. Глифы оценки хода (!, ?, !!, ??, !?, ?!) взаимоисключающие */
export const toggleNag = (tree: GameTree, id: string, nag: string): GameTree => {
  const node = tree.nodes[id];
  if (!node || id === tree.rootId) return tree;
  if (node.nags.includes(nag)) return withNode(tree, id, { nags: node.nags.filter((n) => n !== nag) });
  const rest = MOVE_GLYPH_NAGS.has(nag) ? node.nags.filter((n) => !MOVE_GLYPH_NAGS.has(n)) : node.nags;
  return withNode(tree, id, { nags: [...rest, nag] });
};

export const setComment = (tree: GameTree, id: string, text: string): GameTree => {
  if (!tree.nodes[id]) return tree;
  const comment = text.trim() ? text : undefined;
  return withNode(tree, id, { comment });
};

/** Глиф оценки хода для отображения ('!', '??'…) */
export const moveGlyph = (node: TreeNode): string | undefined =>
  MOVE_GLYPHS.find((g) => node.nags.includes(g.nag))?.symbol;

// ---------------------------------------------------------------- PGN

const escapeComment = (text: string) => text.replace(/[{}]/g, '');

const moveToken = (node: TreeNode, withNumber: boolean) => {
  const number = node.color === 'w' ? `${node.moveNumber}. ` : withNumber ? `${node.moveNumber}... ` : '';
  const nags = node.nags.length ? ` ${node.nags.join(' ')}` : '';
  return `${number}${node.san}${nags}`;
};

/** Линия от узла id (включительно) по главным продолжениям, с вариантами в скобках */
const writeLine = (tree: GameTree, startId: string, numberFirst: boolean): string[] => {
  const out: string[] = [];
  let id: string | undefined = startId;
  let needNumber = numberFirst;
  while (id) {
    const node: TreeNode = tree.nodes[id];
    out.push(moveToken(node, needNumber));
    needNumber = false;
    if (node.comment) {
      out.push(`{${escapeComment(node.comment)}}`);
      needNumber = true;
    }
    // Варианты к этому ходу — сразу после него
    const parent = node.parentId ? tree.nodes[node.parentId] : null;
    if (parent && parent.children[0] === id && parent.children.length > 1) {
      for (const alt of parent.children.slice(1)) out.push(`(${writeLine(tree, alt, true).join(' ')})`);
      needNumber = true;
    }
    id = node.children[0];
  }
  return out;
};

/** movetext PGN: варианты в скобках, глифы $n, комментарии в {} */
export const toPgnMovetext = (tree: GameTree): string => {
  const root = tree.nodes[tree.rootId];
  const parts: string[] = [];
  if (root.comment) parts.push(`{${escapeComment(root.comment)}}`);
  if (root.children[0]) parts.push(...writeLine(tree, root.children[0], true));
  return parts.join(' ');
};

/** Полный PGN (с заголовком FEN, если партия начинается не из начальной позиции) */
export const toPgn = (tree: GameTree, result = '*'): string => {
  const start = startFenOf(tree);
  const headers = start === START_FEN ? '' : `[SetUp "1"]\n[FEN "${start}"]\n\n`;
  const movetext = toPgnMovetext(tree);
  return `${headers}${movetext}${movetext ? ' ' : ''}${result}`;
};

/** Дерево из разобранного PGN (pgnTree.parseSolution): варианты, глифы, комментарии */
const fromMoveTree = (startFen: string, roots: MoveNode[], rootComment?: string): GameTree => {
  let tree = createTree(startFen);
  if (rootComment) tree = setComment(tree, tree.rootId, rootComment);
  const visit = (node: MoveNode, parentId: string) => {
    const added = addMove(tree, parentId, node.san);
    if (!added) return;
    tree = added.tree;
    if (node.commentBefore) {
      // Комментарий перед ходом — к позиции, из которой ход сделан
      const prev = tree.nodes[parentId].comment;
      tree = setComment(tree, parentId, prev ? `${prev} ${node.commentBefore}` : node.commentBefore);
    }
    if (node.nags.length) tree = withNode(tree, added.id, { nags: [...node.nags] });
    if (node.comment) tree = setComment(tree, added.id, node.comment);
    node.children.forEach((child) => visit(child, added.id));
  };
  roots.forEach((root) => visit(root, tree.rootId));
  return tree;
};

/**
 * Разбор PGN с вариантами, глифами и комментариями. Заголовки игнорируются, кроме FEN.
 * null — PGN не разобран (первая ошибка — в error).
 */
export const parsePgn = (pgn: string): { tree: GameTree; error?: string } | null => {
  const fenHeader = /\[FEN\s+"([^"]+)"\]/i.exec(pgn);
  const startFen = fenHeader ? fenHeader[1] : START_FEN;
  const movetext = pgn.replace(/^\s*\[[^\]]*\]\s*$/gm, '').trim();
  const parsed = parseSolution(startFen, movetext);
  if (parsed.error && parsed.tree.roots.length === 0) return null;
  return { tree: fromMoveTree(startFen, parsed.tree.roots, parsed.tree.comment), error: parsed.error };
};

/** Дерево из одной линии UCI (решение задачи) с комментариями по номеру полухода */
export const fromLine = (startFen: string, uciLine: string[], comments: Record<number, string> = {}): GameTree => {
  let tree = createTree(startFen);
  if (comments[0]) tree = setComment(tree, tree.rootId, comments[0]);
  let at = tree.rootId;
  for (const uci of uciLine) {
    const added = addMove(tree, at, { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    if (!added) break;
    tree = added.tree;
    at = added.id;
    const note = comments[tree.nodes[at].ply];
    if (note) tree = setComment(tree, at, note);
  }
  return tree;
};
