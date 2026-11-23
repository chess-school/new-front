import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { ToastHost } from './ToastHost';
import { toast, subscribeToast } from './toast';

// Размонтируем ToastHost после каждого теста: иначе его подписка на глобальный эмиттер и его
// Alert'ы протекают в следующий тест (findByRole('alert') ловит несколько).
afterEach(() => cleanup());

describe('toast system (A.2)', () => {
  it('toast.error показывает Alert с текстом', async () => {
    render(<ToastHost />);
    act(() => {
      toast.error('Что-то пошло не так');
    });
    const el = await screen.findByText('Что-то пошло не так');
    expect(el).toBeTruthy();
  });

  it('toast.success рендерит Alert (role alert)', async () => {
    render(<ToastHost />);
    act(() => {
      toast.success('Готово');
    });
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Готово');
  });

  it('эмиттер доставляет тост подписчику вне React и возвращает id', () => {
    const received: string[] = [];
    const unsub = subscribeToast((t) => received.push(`${t.severity}:${t.message}`));
    const id = toast.info('привет');
    expect(typeof id).toBe('number');
    expect(received).toContain('info:привет');
    unsub();
    toast.info('после отписки');
    expect(received).toEqual(['info:привет']);
  });

  it('нестроковое сообщение приводится к строке', () => {
    const received: string[] = [];
    const unsub = subscribeToast((t) => received.push(t.message));
    toast.error(undefined);
    toast.error(123);
    unsub();
    expect(received).toEqual(['', '123']);
  });
});
