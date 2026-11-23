// Единый императивный toast (замена antd notification/message, Эпик A.2). Фреймворк-агностичный
// эмиттер: работает ВНЕ React-дерева (нужно для axios-интерсептора в api/index.ts). Отрисовку даёт
// <ToastHost/> (MUI Snackbar+Alert), смонтированный один раз под AppThemeProvider.

export type ToastSeverity = 'error' | 'success' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  severity: ToastSeverity;
  message: string;
  duration?: number; // мс; undefined → дефолт в ToastHost
}

export interface ToastOptions {
  duration?: number;
}

type Listener = (t: ToastItem) => void;

let seq = 0;
const listeners = new Set<Listener>();

function emit(severity: ToastSeverity, message: unknown, opts?: ToastOptions): number {
  const id = ++seq;
  const text = typeof message === 'string' ? message : String(message ?? '');
  const item: ToastItem = { id, severity, message: text, duration: opts?.duration };
  listeners.forEach((l) => l(item));
  return id;
}

/** Императивный API: toast.error('…') / success / info / warning. Возвращает id тоста. */
export const toast = {
  error: (message: unknown, opts?: ToastOptions) => emit('error', message, opts),
  success: (message: unknown, opts?: ToastOptions) => emit('success', message, opts),
  info: (message: unknown, opts?: ToastOptions) => emit('info', message, opts),
  warning: (message: unknown, opts?: ToastOptions) => emit('warning', message, opts),
};

/** Подписка ToastHost на поток тостов. Возвращает функцию отписки. */
export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
