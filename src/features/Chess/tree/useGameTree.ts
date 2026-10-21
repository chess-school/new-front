import { useCallback, useMemo, useRef, useState } from 'react';
import {
  addMove, createTree, deleteBranch, exitVariation, GameTree, makeMainline, MoveInput, parsePgn, pathTo,
  promoteVariation, setComment, toggleNag, toPgn, TreeNode,
} from './gameTree';

interface TreeState {
  tree: GameTree;
  /** Текущая позиция (узел дерева) */
  currentId: string;
}

/**
 * Разбор партии по дереву вариантов: курсор, ходы с автоматическим ветвлением,
 * навигация (назад/вперёд по главному продолжению, к началу/концу, выход из варианта),
 * правка дерева (сделать главным, поднять, удалить ветку), глифы и комментарии, PGN.
 */
export const useGameTree = (initial?: GameTree | (() => GameTree)) => {
  const [state, setState] = useState<TreeState>(() => {
    const tree = typeof initial === 'function' ? initial() : initial ?? createTree();
    return { tree, currentId: tree.rootId };
  });
  // Синхронная копия: play() должен сразу ответить доске, принят ли ход (иначе фигура вернётся)
  const ref = useRef(state);
  ref.current = state;
  const commit = useCallback((next: TreeState) => {
    if (next.tree === ref.current.tree && next.currentId === ref.current.currentId) return;
    ref.current = next;
    setState(next);
  }, []);
  const update = useCallback((fn: (s: TreeState) => TreeState) => commit(fn(ref.current)), [commit]);

  const { tree, currentId } = state;
  const current: TreeNode = tree.nodes[currentId] ?? tree.nodes[tree.rootId];
  const path = useMemo(() => pathTo(tree, current.id), [tree, current.id]);

  /** Ход из текущей позиции; false — нелегален */
  const play = useCallback((move: MoveInput): boolean => {
    const s = ref.current;
    const result = addMove(s.tree, s.currentId, move);
    if (!result) return false;
    commit({ tree: result.tree, currentId: result.id });
    return true;
  }, [commit]);

  const goTo = useCallback((id: string) => update((s) => (s.tree.nodes[id] ? { ...s, currentId: id } : s)), [update]);
  const back = useCallback(() => update((s) => {
    const parent = s.tree.nodes[s.currentId]?.parentId;
    return parent ? { ...s, currentId: parent } : s;
  }), [update]);
  const forward = useCallback(() => update((s) => {
    const next = s.tree.nodes[s.currentId]?.children[0];
    return next ? { ...s, currentId: next } : s;
  }), [update]);
  const toStart = useCallback(() => update((s) => ({ ...s, currentId: s.tree.rootId })), [update]);
  /** В конец текущей линии (по главным продолжениям) */
  const toEnd = useCallback(() => update((s) => {
    let id = s.currentId;
    while (s.tree.nodes[id].children[0]) id = s.tree.nodes[id].children[0];
    return { ...s, currentId: id };
  }), [update]);
  /** Выйти из варианта в точку ответвления */
  const up = useCallback(() => update((s) => {
    const target = exitVariation(s.tree, s.currentId);
    return target ? { ...s, currentId: target } : s;
  }), [update]);
  /** Соседний вариант того же хода (стрелки вверх/вниз, как на Lichess) */
  const sibling = useCallback((delta: 1 | -1) => update((s) => {
    const node = s.tree.nodes[s.currentId];
    if (!node?.parentId) return s;
    const siblings = s.tree.nodes[node.parentId].children;
    const next = siblings[(siblings.indexOf(node.id) + delta + siblings.length) % siblings.length];
    return { ...s, currentId: next };
  }), [update]);

  const edit = useCallback((fn: (t: GameTree, id: string) => GameTree) => update((s) => ({ ...s, tree: fn(s.tree, s.currentId) })), [update]);
  const promote = useCallback(() => edit(promoteVariation), [edit]);
  const mainline = useCallback(() => edit(makeMainline), [edit]);
  const remove = useCallback(() => update((s) => {
    if (s.currentId === s.tree.rootId) return s;
    const { tree: next, parentId } = deleteBranch(s.tree, s.currentId);
    return { tree: next, currentId: parentId };
  }), [update]);
  const nag = useCallback((value: string) => edit((t, id) => toggleNag(t, id, value)), [edit]);
  const comment = useCallback((text: string, id?: string) => update((s) => ({ ...s, tree: setComment(s.tree, id ?? s.currentId, text) })), [update]);

  /** Загрузить PGN (с вариантами); курсор — в конец главной линии. false — PGN не разобран */
  const loadPgn = useCallback((pgn: string): boolean => {
    const parsed = parsePgn(pgn);
    if (!parsed) return false;
    let id = parsed.tree.rootId;
    while (parsed.tree.nodes[id].children[0]) id = parsed.tree.nodes[id].children[0];
    commit({ tree: parsed.tree, currentId: id });
    return true;
  }, [commit]);
  /** Новое дерево; курсор — в узел at (по умолчанию — начальная позиция) */
  const reset = useCallback((next?: GameTree, at?: string) => {
    const t = next ?? createTree();
    commit({ tree: t, currentId: at && t.nodes[at] ? at : t.rootId });
  }, [commit]);

  const exportPgn = useCallback(() => toPgn(ref.current.tree), []);

  return {
    tree, current, path,
    fen: current.fen,
    /** Последний ход текущей позиции — подсветка полей */
    lastMove: current.uci ? { from: current.uci.slice(0, 2), to: current.uci.slice(2, 4) } : null,
    actions: { play, goTo, back, forward, toStart, toEnd, up, sibling, promote, mainline, remove, nag, comment, loadPgn, reset, exportPgn },
  };
};

export type GameTreeApi = ReturnType<typeof useGameTree>;
