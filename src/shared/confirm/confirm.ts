// Промис-based подтверждение (замена antd Modal.confirm, A.2 Wave 4). Отрисовку даёт <ConfirmHost/>
// (MUI Dialog), смонтированный один раз под AppThemeProvider. Совместимо с antd-вызовом: принимает
// { title, content, okText, cancelText, danger, onOk }, вызывает onOk при подтверждении и резолвит boolean.

export interface ConfirmOptions {
  title?: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  onOk?: () => void | Promise<void>;
}

export interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (confirmed: boolean) => void;
}

let seq = 0;
const listeners = new Set<(r: ConfirmRequest) => void>();

/** Показать диалог подтверждения. Резолвит true/false; при true сначала ждёт onOk (если задан). */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (listeners.size === 0) {
      // Нет смонтированного хоста — безопасный дефолт: не подтверждено.
      resolve(false);
      return;
    }
    const req: ConfirmRequest = { ...opts, id: ++seq, resolve };
    listeners.forEach((l) => l(req));
  });
}

export function subscribeConfirm(listener: (r: ConfirmRequest) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
