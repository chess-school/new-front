import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Состояние, которое живёт прямо в query-строке URL: ссылку можно скопировать, а
 * перезагрузка страницы сохраняет выбор. Значение по умолчанию в адрес не пишется —
 * ссылка остаётся чистой (`/rating` вместо `/rating?source=lichess`).
 *
 * @param key      имя параметра в строке запроса
 * @param fallback значение, когда параметра нет (или он не из списка допустимых)
 * @param allowed  необязательный белый список значений — чужое значение откатывается к fallback
 */
export function useQueryParam<T extends string>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
): [T, (next: T) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const value = raw !== null && (!allowed || (allowed as readonly string[]).includes(raw)) ? (raw as T) : fallback;

  const set = useCallback((next: T) => {
    // Функциональная форма — чтобы не затирать остальные параметры в URL
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      if (next === fallback) p.delete(key);
      else p.set(key, next);
      return p;
    }, { replace: true });
  }, [key, fallback, setParams]);

  return [value, set];
}
