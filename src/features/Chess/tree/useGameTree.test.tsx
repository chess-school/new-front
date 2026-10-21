import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { useGameTree } from './useGameTree';
import { useTreeKeyboard } from './useTreeKeyboard';
import { VariationTree } from '../components/VariationTree';
import { AnnotationPanel } from '../components/AnnotationPanel';
import { continuation, isMainline } from './gameTree';

const sanLine = (r: { current: ReturnType<typeof useGameTree> }) => r.current.path.slice(1).map((n) => n.san);

describe('useGameTree', () => {
  it('play() сразу отвечает доске; ход из середины — новая ветка, главная линия цела', () => {
    const { result } = renderHook(() => useGameTree());
    let ok = false;
    act(() => { ok = result.current.actions.play({ from: 'e2', to: 'e4' }); });
    expect(ok).toBe(true);
    act(() => { result.current.actions.play('e5'); result.current.actions.play('Nf3'); });
    act(() => { ok = result.current.actions.play('Ke3'); });
    expect(ok).toBe(false); // нелегальный — фигура вернётся
    act(() => { result.current.actions.back(); result.current.actions.back(); });
    expect(sanLine(result)).toEqual(['e4']);
    act(() => { result.current.actions.play('c5'); });
    expect(sanLine(result)).toEqual(['e4', 'c5']);
    expect(continuation(result.current.tree, result.current.tree.rootId).map((n) => n.san)).toEqual(['e4', 'e5', 'Nf3']);
    // ↑/↓ — соседний вариант того же хода
    act(() => { result.current.actions.sibling(-1); });
    expect(sanLine(result)).toEqual(['e4', 'e5']);
  });

  it('«Сделать главным», «Подняться», «Удалить ветку», глифы и комментарий', () => {
    const { result } = renderHook(() => useGameTree());
    act(() => { ['e4', 'e5', 'Nf3'].forEach((m) => result.current.actions.play(m)); });
    act(() => { result.current.actions.toStart(); result.current.actions.forward(); result.current.actions.play('c5'); result.current.actions.play('Nf3'); });
    const variationNode = result.current.current.id;
    act(() => { result.current.actions.up(); });
    expect(sanLine(result)).toEqual(['e4']); // точка ответвления
    act(() => { result.current.actions.goTo(variationNode); result.current.actions.mainline(); });
    expect(isMainline(result.current.tree, variationNode)).toBe(true);
    act(() => { result.current.actions.nag('$3'); result.current.actions.comment('Сицилианская!'); });
    expect(result.current.current.nags).toEqual(['$3']);
    expect(result.current.actions.exportPgn()).toContain('2. Nf3 $3 {Сицилианская!}');
    act(() => { result.current.actions.remove(); });
    expect(sanLine(result)).toEqual(['e4', 'c5']);
  });

  it('loadPgn: варианты и комментарии; курсор — в конец главной линии; битый PGN — false', () => {
    const { result } = renderHook(() => useGameTree());
    let ok = false;
    act(() => { ok = result.current.actions.loadPgn('1. e4 e5 (1... c5 {Сицилианская}) 2. Nf3! *'); });
    expect(ok).toBe(true);
    expect(sanLine(result)).toEqual(['e4', 'e5', 'Nf3']);
    act(() => { ok = result.current.actions.loadPgn('1. Ke5'); });
    expect(ok).toBe(false);
  });
});

describe('VariationTree + AnnotationPanel', () => {
  const Harness = () => {
    const game = useGameTree();
    useTreeKeyboard(game);
    return (
      <>
        <button type="button" onClick={() => game.actions.loadPgn('1. e4 e5 (1... c5 2. Nf3 (2. c3) d6) 2. Nf3 {Развитие} Nc6 *')}>load</button>
        <VariationTree tree={game.tree} currentId={game.current.id} onSelect={game.actions.goTo} />
        <AnnotationPanel game={game} />
        <span data-testid="pos">{game.path.slice(1).map((n) => n.san).join(' ')}</span>
      </>
    );
  };

  it('варианты — под ходом, вложенный — в скобках; комментарий — блоком; клик и клавиатура', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('load'));
    const lines = screen.getAllByTestId('variation-line');
    expect(lines).toHaveLength(1);
    expect(lines[0].textContent).toBe('1...c52.Nf3 (2.c3) 2...d6');
    expect(screen.getByTestId('move-comment').textContent).toBe('Развитие');

    fireEvent.click(screen.getByText('c3'));
    expect(screen.getByTestId('pos').textContent).toBe('e4 c5 c3');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('pos').textContent).toBe('e4 c5');
    fireEvent.keyDown(window, { key: 'End' });
    expect(screen.getByTestId('pos').textContent).toBe('e4 c5 Nf3 d6');

    // Глиф «??» на текущем ходу — виден в нотации
    fireEvent.click(screen.getByRole('button', { name: /\?\? / }));
    expect(within(screen.getByTestId('variation-tree')).getByText('??')).toBeTruthy();
    // «Подняться на уровень вверх» — к 1. e4, где ответвился вариант
    fireEvent.click(screen.getByRole('button', { name: /Up one level|exit variation/i }));
    expect(screen.getByTestId('pos').textContent).toBe('e4');
  });
});
