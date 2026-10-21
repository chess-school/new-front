import { describe, expect, it } from 'vitest';
import { formatMoveNumber, getMainline, parseSolution, setSideToMove } from './pgnTree';

const EX130_FEN = '2rr2k1/pbqnbppp/1p3n2/2pp4/3P4/1PNBPN2/PB2QPPP/2RR2K1 w - - 0 14';
const EX130 = '14. Bf5 $1 { Activating the bishop } 14... g6 15. Bh3 Ra8 ( 15... Ne4 { runs into: } 16. Nxe4 $1 '
  + '16... dxe4 17. Nd2 $1 ( 17. Ne5 $2 Nxe5 $1 18. Bxc8 Nd3 $10 ) 17... Bf6 18. Ba3 ) 16. Ne5 Nxe5 17. dxe5 Ne4 18. Nxe4 dxe4 19. e6 *';

describe('parseSolution', () => {
  it('главная линия, варианты и комментарии упражнения 130', () => {
    const { tree, error } = parseSolution(EX130_FEN, EX130);
    expect(error).toBeUndefined();
    expect(getMainline(tree).map((n) => formatMoveNumber(n) + n.san).slice(0, 4)).toEqual(['14.Bf5', '14...g6', '15.Bh3', '15...Ra8']);
    const afterBh3 = tree.roots[0].children[0].children[0].children;
    expect(afterBh3.map((n) => n.san)).toEqual(['Ra8', 'Ne4']);
    expect(afterBh3[1].comment).toBe('runs into:');
    expect(tree.roots[0].nags).toEqual(['$1']);
  });

  it('нелегальный ход — ошибка и дерево до неё', () => {
    const { tree, error } = parseSolution('8/8/8/8/8/8/8/K6k w - - 0 1', '1. Kb2 Kxa1');
    expect(error).toMatch(/Illegal move "Kxa1"/);
    expect(getMainline(tree)).toHaveLength(1);
  });

  it('незакрытый вариант и битый FEN', () => {
    expect(parseSolution('8/8/8/8/8/8/8/K6k w - - 0 1', '1. Kb2 ( 1. Kb1').error).toMatch(/Unclosed/);
    expect(parseSolution('garbage', '1. e4').error).toBeTruthy();
  });

  it('смена очереди хода сбрасывает взятие на проходе', () => {
    expect(setSideToMove('8/8/8/8/8/8/8/K6k w - e3 0 1', 'b')).toBe('8/8/8/8/8/8/8/K6k b - - 0 1');
  });
});
