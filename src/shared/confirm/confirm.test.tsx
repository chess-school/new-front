import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ConfirmHost } from './ConfirmHost';
import { confirmDialog } from './confirm';

afterEach(() => cleanup());

describe('confirmDialog (A.2 Wave 4)', () => {
  it('подтверждение → resolve(true) и вызов onOk', async () => {
    render(<ConfirmHost />);
    const onOk = vi.fn();
    const p = confirmDialog({ title: 'Удалить?', okText: 'Удалить', cancelText: 'Отмена', onOk });
    const btn = await screen.findByRole('button', { name: 'Удалить' });
    fireEvent.click(btn);
    await expect(p).resolves.toBe(true);
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('отмена → resolve(false), onOk не вызван', async () => {
    render(<ConfirmHost />);
    const onOk = vi.fn();
    const p = confirmDialog({ title: 'X', okText: 'OK', cancelText: 'Отмена', onOk });
    const btn = await screen.findByRole('button', { name: 'Отмена' });
    fireEvent.click(btn);
    await expect(p).resolves.toBe(false);
    expect(onOk).not.toHaveBeenCalled();
  });

  it('нет смонтированного хоста → resolve(false)', async () => {
    await expect(confirmDialog({ title: 'нет хоста' })).resolves.toBe(false);
  });
});
