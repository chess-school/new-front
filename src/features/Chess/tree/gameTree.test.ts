import { describe, expect, it } from 'vitest';
import {
  addMove, continuation, createTree, deleteBranch, exitVariation, fromLine, GameTree, isMainline, makeMainline,
  moveGlyph, parsePgn, pathTo, promoteVariation, setComment, toggleNag, toPgn, toPgnMovetext,
} from './gameTree';

/** Сыграть линию SAN от узла, вернуть дерево и id последнего узла */
const play = (tree: GameTree, from: string, ...sans: string[]) => {
  let at = from;
  for (const san of sans) {
    const r = addMove(tree, at, san);
    if (!r) throw new Error(`illegal ${san}`);
    tree = r.tree;
    at = r.id;
  }
  return { tree, at };
};
const sans = (tree: GameTree, id: string) => pathTo(tree, id).slice(1).map((n) => n.san);

describe('дерево вариантов', () => {
  it('ход из середины создаёт вариант; повтор существующего хода — переход без изменений', () => {
    let { tree, at } = play(createTree(), 'root', 'e4', 'e5', 'Nf3');
    const e4 = tree.nodes.root.children[0];
    const again = addMove(tree, e4, 'e5')!;
    expect(again.tree).toBe(tree); // дерево не изменилось
    expect(again.id).toBe(tree.nodes[e4].children[0]);
    ({ tree, at } = play(tree, e4, 'c5', 'Nf3'));
    expect(tree.nodes[e4].children.map((c) => tree.nodes[c].san)).toEqual(['e5', 'c5']); // e5 — главный, c5 — вариант
    expect(sans(tree, at)).toEqual(['e4', 'c5', 'Nf3']);
    expect(isMainline(tree, at)).toBe(false);
    expect(continuation(tree, 'root').map((n) => n.san)).toEqual(['e4', 'e5', 'Nf3']);
  });

  it('нелегальный ход — null', () => {
    expect(addMove(createTree(), 'root', 'e5')).toBeNull();
    expect(addMove(createTree(), 'root', { from: 'e2', to: 'e5' })).toBeNull();
  });

  it('«Сделать главным» поднимает вложенный вариант до главной линии, «Поднять» — на один уровень', () => {
    let { tree } = play(createTree(), 'root', 'e4', 'e5', 'Nf3', 'Nc6');
    const e5 = tree.nodes[tree.nodes.root.children[0]].children[0];
    const nf3 = tree.nodes[e5].children[0];
    const { tree: t2, at: c5 } = play(tree, tree.nodes.root.children[0], 'c5');  // вариант 1... c5
    const { tree: t3, at: deep } = play(t2, c5, 'Nf3', 'd6');                    // в нём 2. Nf3 d6
    const { tree: t4, at: nested } = play(t3, c5, 'c3');   // вложенный 2. c3 в варианте c5
    tree = t4;
    expect(sans(tree, nested)).toEqual(['e4', 'c5', 'c3']);

    const promoted = promoteVariation(tree, nested); // c3 становится главным внутри варианта c5
    expect(promoted.nodes[c5].children[0]).toBe(nested);
    expect(isMainline(promoted, nested)).toBe(false); // сам c5 всё ещё вариант

    const main = makeMainline(tree, nested);
    expect(isMainline(main, nested)).toBe(true);
    expect(continuation(main, 'root').map((n) => n.san)).toEqual(['e4', 'c5', 'c3']);
    expect(main.nodes[nf3]).toBeDefined(); // старая главная линия сохранилась вариантом
    expect(isMainline(main, deep)).toBe(false);
  });

  it('«Удалить ветку» убирает узел со всем продолжением и возвращает родителя', () => {
    const { tree, at } = play(createTree(), 'root', 'd4', 'd5', 'c4');
    const d5 = tree.nodes[tree.nodes.root.children[0]].children[0];
    const { tree: after, parentId } = deleteBranch(tree, d5);
    expect(parentId).toBe(tree.nodes.root.children[0]);
    expect(after.nodes[d5]).toBeUndefined();
    expect(after.nodes[at]).toBeUndefined();
    expect(after.nodes[parentId].children).toEqual([]);
    expect(deleteBranch(tree, 'root').tree).toBe(tree); // корень не удаляется
  });

  it('«Подняться на уровень вверх» — в точку ответвления варианта; на главной линии — null', () => {
    const { tree } = play(createTree(), 'root', 'e4', 'e5', 'Nf3');
    const e4 = tree.nodes.root.children[0];
    const { tree: t2, at } = play(tree, e4, 'c5', 'Nf3', 'd6');
    expect(exitVariation(t2, at)).toBe(e4);
    expect(exitVariation(t2, t2.nodes[e4].children[0])).toBeNull();
  });

  it('глифы: !, ?, !!, ??, !?, ?! взаимоисключающие; повторное нажатие снимает', () => {
    const { tree, at } = play(createTree(), 'root', 'e4');
    let t = toggleNag(tree, at, '$1');
    expect(moveGlyph(t.nodes[at])).toBe('!');
    t = toggleNag(t, at, '$4');
    expect(t.nodes[at].nags).toEqual(['$4']);
    expect(moveGlyph(t.nodes[at])).toBe('??');
    t = toggleNag(t, at, '$4');
    expect(t.nodes[at].nags).toEqual([]);
    t = toggleNag(toggleNag(t, at, '$14'), at, '$5'); // оценка позиции (⩲) совместима с глифом хода
    expect(t.nodes[at].nags).toEqual(['$14', '$5']);
  });

  it('PGN: варианты в скобках, глифы и комментарии; разбор и запись — туда и обратно', () => {
    const played = play(createTree(), 'root', 'e4', 'e5', 'Nf3');
    const { at } = played;
    let { tree } = played;
    const e4 = tree.nodes.root.children[0];
    tree = setComment(toggleNag(tree, at, '$1'), at, 'Развитие с темпом');
    ({ tree } = play(tree, e4, 'c5', 'Nf3'));
    const text = toPgnMovetext(tree);
    expect(text).toBe('1. e4 e5 (1... c5 2. Nf3) 2. Nf3 $1 {Развитие с темпом}');

    const back = parsePgn(`[Event "Test"]\n\n${text} *`)!;
    expect(back.error).toBeUndefined();
    expect(toPgnMovetext(back.tree)).toBe(text);
    // Суффиксы «!?» в SAN понимаются как глифы
    const suffix = parsePgn('1. e4!? e5?! 2. Qh5?? Nc6')!;
    const line = continuation(suffix.tree, 'root');
    expect(line.map((n) => moveGlyph(n))).toEqual(['!?', '?!', '??', undefined]);
  });

  it('PGN не из начальной позиции: заголовок FEN; номер хода чёрных', () => {
    const fen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 20';
    const { tree } = play(createTree(fen), 'root', 'h6', 'Ra8+');
    expect(toPgn(tree)).toBe(`[SetUp "1"]\n[FEN "${fen}"]\n\n20... h6 21. Ra8+ *`);
    const parsed = parsePgn(toPgn(tree))!;
    expect(continuation(parsed.tree, 'root').map((n) => n.san)).toEqual(['h6', 'Ra8+']);
  });

  it('линия UCI с комментариями по полуходам (решение задачи)', () => {
    const tree = fromLine(createTree().nodes.root.fen, ['e2e4', 'e7e5', 'zzzz'], { 1: 'Центр', 2: 'Симметрия' });
    const line = continuation(tree, 'root');
    expect(line.map((n) => [n.san, n.comment])).toEqual([['e4', 'Центр'], ['e5', 'Симметрия']]);
  });
});
