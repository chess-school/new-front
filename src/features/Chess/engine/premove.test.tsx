import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { applyPremoves, boardFromFen, isPromotionPremove, premoveDests } from './premove';
import { ChessBoard } from '../components/ChessBoard';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const sorted = (a: string[]) => [...a].sort();

describe('цели предходов (геометрия, как chessground)', () => {
  it('пешка: вперёд на 1–2 с исходной и наискосок (взятие может появиться)', () => {
    expect(sorted(premoveDests(boardFromFen(START), 'e2'))).toEqual(['d3', 'e3', 'e4', 'f3']);
    expect(sorted(premoveDests(boardFromFen(START), 'e7'))).toEqual(['d6', 'e5', 'e6', 'f6']);
  });

  it('дальнобойные — лучи до края, сквозь фигуры; свои фигуры — не цель', () => {
    const board = boardFromFen('4k3/8/8/8/8/8/3p4/R3K2R w KQ - 0 1');
    const rook = premoveDests(board, 'a1');
    expect(rook).toContain('a8');
    expect(rook).toContain('d1');
    expect(rook).not.toContain('e1'); // свой король
    // Король: шаг и обе рокировки
    expect(premoveDests(board, 'e1')).toEqual(expect.arrayContaining(['g1', 'c1', 'd2', 'f2']));
  });

  it('конь — прыжки; цепочка предходов считается от «будущей» позиции', () => {
    const board = boardFromFen(START);
    expect(sorted(premoveDests(board, 'g1'))).toEqual(['f3', 'h3']); // e2 занято своей пешкой
    const after = applyPremoves(board, [{ from: 'g1', to: 'f3' }]);
    expect(premoveDests(after, 'f3')).toEqual(expect.arrayContaining(['g5', 'e5', 'h4', 'd4', 'g1']));
    expect(after.get('g1')).toBeUndefined();
  });

  it('пешка на последнюю горизонталь — превращение', () => {
    const board = boardFromFen('8/4P3/8/8/8/8/8/k6K b - - 0 1');
    expect(isPromotionPremove(board, 'e7', 'e8')).toBe(true);
    expect(applyPremoves(board, [{ from: 'e7', to: 'e8', promotion: 'q' }]).get('e8')).toBe('wQ');
  });
});

describe('ChessBoard: очередь предходов', () => {
  // react-chessboard рисует клетки, только узнав свою ширину
  const realRO = globalThis.ResizeObserver;
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) { this.cb = cb; }
      observe(el: Element) { setTimeout(() => this.cb([{ target: el, contentRect: { width: 400, height: 400 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver), 0); }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return 400; } });
  });
  afterAll(() => { globalThis.ResizeObserver = realRO; });

  const square = (container: HTMLElement, sq: string) => container.querySelector(`[data-square="${sq}"]`) as HTMLElement;

  it('ход соперника → предход исполняется сам, подсветка снимается', async () => {
    // Белые сыграли 1. e4, ход чёрных; игрок — белые
    const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const onMove = vi.fn(() => true);
    const { container, rerender } = render(<ChessBoard fen={afterE4} onMove={onMove} boardOrientation="white" premoves premoveKey="p1" />);
    await waitFor(() => expect(square(container, 'g1')).toBeTruthy());

    // Предход 2. Nf3: клик по коню и по цели — ход не отправлен, поля подсвечены
    act(() => { fireEvent.click(square(container, 'g1')); });
    act(() => { fireEvent.click(square(container, 'f3')); });
    expect(onMove).not.toHaveBeenCalled();
    await waitFor(() => expect(container.innerHTML).toMatch(/rgba\(88, 166, 255, 0\.42\)/));

    // Соперник ответил 1... e5 — предход исполняется автоматически
    rerender(<ChessBoard fen="rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2" onMove={onMove} boardOrientation="white" premoves premoveKey="p1" />);
    await waitFor(() => expect(onMove).toHaveBeenCalledWith('g1', 'f3', undefined));
    expect(onMove).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(container.innerHTML).not.toMatch(/rgba\(88, 166, 255, 0\.42\)/));
  });

  it('два предхода подряд: второй ждёт следующего ответа; отклонённый ход сбрасывает очередь', async () => {
    const onMove = vi.fn(() => true);
    const black1 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const { container, rerender } = render(<ChessBoard fen={black1} onMove={onMove} boardOrientation="white" premoves premoveKey="q" />);
    await waitFor(() => expect(square(container, 'g1')).toBeTruthy());
    act(() => { fireEvent.click(square(container, 'g1')); });
    act(() => { fireEvent.click(square(container, 'f3')); });
    act(() => { fireEvent.click(square(container, 'f1')); });   // второй предход — слон с f1
    act(() => { fireEvent.click(square(container, 'c4')); });
    rerender(<ChessBoard fen="rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2" onMove={onMove} boardOrientation="white" premoves premoveKey="q" />);
    await waitFor(() => expect(onMove).toHaveBeenCalledTimes(1));
    expect(onMove).toHaveBeenLastCalledWith('g1', 'f3', undefined);
    // Родитель отклонит следующий ход (например, неверный в задаче) — очередь очищается
    onMove.mockReturnValueOnce(false);
    rerender(<ChessBoard fen="r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3" onMove={onMove} boardOrientation="white" premoves premoveKey="q" />);
    await waitFor(() => expect(onMove).toHaveBeenCalledTimes(2));
    expect(onMove).toHaveBeenLastCalledWith('f1', 'c4', undefined);
    await waitFor(() => expect(container.innerHTML).not.toMatch(/rgba\(88, 166, 255, 0\.42\)/));
  });

  it('новая задача (premoveKey) сбрасывает поставленный предход', async () => {
    const blackToMove = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const onMove = vi.fn(() => true);
    const { container, rerender } = render(<ChessBoard fen={blackToMove} onMove={onMove} boardOrientation="white" premoves premoveKey="a" />);
    await waitFor(() => expect(square(container, 'g1')).toBeTruthy());
    act(() => { fireEvent.click(square(container, 'g1')); });
    act(() => { fireEvent.click(square(container, 'f3')); });
    // Другая задача, сразу ход белых — старый предход не должен сыграться
    rerender(<ChessBoard fen={START} onMove={onMove} boardOrientation="white" premoves premoveKey="b" />);
    await new Promise((r) => setTimeout(r, 30));
    expect(onMove).not.toHaveBeenCalled();
  });

  it('без premoves в ход соперника фигуры не ходят', async () => {
    const blackToMove = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const onMove = vi.fn(() => true);
    const { container, rerender } = render(<ChessBoard fen={blackToMove} onMove={onMove} boardOrientation="white" />);
    await waitFor(() => expect(square(container, 'g1')).toBeTruthy());
    act(() => { fireEvent.click(square(container, 'g1')); });
    act(() => { fireEvent.click(square(container, 'f3')); });
    rerender(<ChessBoard fen="rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2" onMove={onMove} boardOrientation="white" />);
    await new Promise((r) => setTimeout(r, 30));
    expect(onMove).not.toHaveBeenCalled();
  });
});
