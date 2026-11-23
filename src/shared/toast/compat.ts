// Совместимый слой: даёт API antd `notification`/`message`, но форвардит в наш MUI-toast (A.2 Wave 2-3).
// Позволяет убрать antd из ~37 файлов заменой ОДНОЙ строки импорта, без переписывания каждого вызова.
// antd notification принимает { message, description }; показываем description (деталь), иначе message.
// antd message принимает строку. duration antd — в СЕКУНДАХ, toast ждёт мс.
import { toast } from './toast';

type NotifArg = { message?: unknown; description?: unknown; duration?: number };

const toText = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const notifText = (a: NotifArg | string): string => {
  if (typeof a === 'string') return a;
  const d = a?.description;
  return toText(d != null && d !== '' ? d : a?.message);
};

const notifOpts = (a: NotifArg | string) =>
  (typeof a === 'object' && a?.duration != null ? { duration: a.duration * 1000 } : undefined);

/** Замена antd `notification` ({ message, description }). */
export const notification = {
  error: (a: NotifArg | string) => toast.error(notifText(a), notifOpts(a)),
  success: (a: NotifArg | string) => toast.success(notifText(a), notifOpts(a)),
  warning: (a: NotifArg | string) => toast.warning(notifText(a), notifOpts(a)),
  info: (a: NotifArg | string) => toast.info(notifText(a), notifOpts(a)),
  open: (a: NotifArg | string) => toast.info(notifText(a), notifOpts(a)),
};

/** Замена antd `message` (строка-контент). */
export const message = {
  success: (c: unknown) => toast.success(toText(typeof c === 'object' && c ? (c as { content?: unknown }).content ?? c : c)),
  error: (c: unknown) => toast.error(toText(typeof c === 'object' && c ? (c as { content?: unknown }).content ?? c : c)),
  warning: (c: unknown) => toast.warning(toText(typeof c === 'object' && c ? (c as { content?: unknown }).content ?? c : c)),
  info: (c: unknown) => toast.info(toText(typeof c === 'object' && c ? (c as { content?: unknown }).content ?? c : c)),
  loading: (c: unknown) => toast.info(toText(typeof c === 'object' && c ? (c as { content?: unknown }).content ?? c : c)),
};
