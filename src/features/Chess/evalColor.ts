import { tokens } from '@/theme/tokens';

/**
 * Единый цвет текста оценки движка для панелей анализа (A.3.3 — убирает дубль scoreColor/evalColor
 * из EnginePanel и AnalysisPanel). Возвращает MUI-токен темы (или brand-токен для равенства).
 *
 *   нет данных      → 'text.secondary'
 *   перевес чёрных  → 'error.main'   (negative)
 *   равенство       → tokens.accent.gold (brand; только если вызывающий различает равенство)
 *   иначе (белые)   → 'text.primary'
 */
export function evalColorFor(opts: { hasValue: boolean; negative: boolean; equal?: boolean }): string {
  if (!opts.hasValue) return 'text.secondary';
  if (opts.negative) return 'error.main';
  if (opts.equal) return tokens.accent.gold;
  return 'text.primary';
}

/** Цвет по строковой оценке ('−1.2', '0.00', '+0.5') — поведение прежнего AnalysisPanel.evalColor. */
export const evalColorFromString = (evaluation: string | null): string =>
  evalColorFor({
    hasValue: !!evaluation,
    negative: !!evaluation && evaluation.startsWith('-'),
    equal: evaluation === '0.00',
  });

/** Цвет по линии движка ({scoreCp, mate}) — поведение прежнего EnginePanel.scoreColor (без случая равенства). */
export const evalColorFromLine = (line: { scoreCp?: number; mate?: number } | undefined): string =>
  evalColorFor({
    hasValue: !!line,
    negative: !line ? false : line.mate !== undefined ? line.mate < 0 : (line.scoreCp ?? 0) < 0,
  });
