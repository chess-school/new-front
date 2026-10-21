import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

describe('ResizableBoard', () => {
  const realMatchMedia = window.matchMedia;
  beforeEach(() => {
    localStorage.removeItem('board.size');
    // В jsdom нет PointerEvent: без него clientX/clientY не доходят до обработчиков
    if (!('PointerEvent' in window)) {
      class PointerEventPolyfill extends MouseEvent {
        pointerId: number;
        constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; }
      }
      (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill;
    }
    // Десктоп: (min-width: 900px) выполняется
    window.matchMedia = ((query: string) => ({
      matches: true, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => { window.matchMedia = realMatchMedia; });

  it('тянется за правый нижний угол, размер запоминается и общий для всех досок', async () => {
    vi.resetModules();
    const { ResizableBoard } = await import('./ResizableBoard');
    render(
      <>
        <ResizableBoard maxWidth={1000}><div>A</div></ResizableBoard>
        <ResizableBoard maxWidth={1000}><div>B</div></ResizableBoard>
      </>,
    );
    const [first, second] = screen.getAllByTestId('resizable-board');
    const start = Number(first.dataset.size);
    const [handle] = screen.getAllByRole('slider');
    act(() => {
      fireEvent.pointerDown(handle, { clientX: 100, clientY: 100, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientX: 160, clientY: 140, pointerId: 1 });
      fireEvent.pointerUp(handle, { pointerId: 1 });
    });
    expect(Number(first.dataset.size)).toBe(start + 50);
    expect(Number(second.dataset.size)).toBe(start + 50);
    expect(localStorage.getItem('board.size')).toBe(String(start + 50));
    // Не меньше минимума и не больше доступного места
    act(() => {
      fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientX: -2000, clientY: -2000, pointerId: 1 });
      fireEvent.pointerUp(handle, { pointerId: 1 });
    });
    expect(Number(first.dataset.size)).toBe(240);
    // Двойной клик — размер по умолчанию; стрелки — шаг 16px
    act(() => { fireEvent.doubleClick(handle); });
    expect(Number(first.dataset.size)).toBe(480);
    act(() => { fireEvent.keyDown(handle, { key: 'ArrowUp' }); });
    expect(Number(first.dataset.size)).toBe(496);
  });
});
