import { describe, it, expect } from 'vitest';
import { evalColorFor, evalColorFromString, evalColorFromLine } from './evalColor';
import { tokens } from '@/theme/tokens';

describe('evalColorFor', () => {
  it('нет данных → text.secondary', () => {
    expect(evalColorFor({ hasValue: false, negative: false })).toBe('text.secondary');
  });
  it('перевес чёрных → error.main', () => {
    expect(evalColorFor({ hasValue: true, negative: true })).toBe('error.main');
  });
  it('равенство → brand gold', () => {
    expect(evalColorFor({ hasValue: true, negative: false, equal: true })).toBe(tokens.accent.gold);
  });
  it('перевес белых → text.primary', () => {
    expect(evalColorFor({ hasValue: true, negative: false })).toBe('text.primary');
  });
});

describe('evalColorFromString (прежний AnalysisPanel.evalColor)', () => {
  it('null → secondary', () => expect(evalColorFromString(null)).toBe('text.secondary'));
  it('отрицательная → error', () => expect(evalColorFromString('-1.2')).toBe('error.main'));
  it('0.00 → равенство gold', () => expect(evalColorFromString('0.00')).toBe(tokens.accent.gold));
  it('положительная → primary', () => expect(evalColorFromString('+0.5')).toBe('text.primary'));
});

describe('evalColorFromLine (прежний EnginePanel.scoreColor)', () => {
  it('нет линии → secondary', () => expect(evalColorFromLine(undefined)).toBe('text.secondary'));
  it('мат за чёрных → error', () => expect(evalColorFromLine({ mate: -3 })).toBe('error.main'));
  it('мат за белых → primary', () => expect(evalColorFromLine({ mate: 2 })).toBe('text.primary'));
  it('cp<0 → error', () => expect(evalColorFromLine({ scoreCp: -50 })).toBe('error.main'));
  it('cp>=0 → primary (без случая равенства)', () => expect(evalColorFromLine({ scoreCp: 0 })).toBe('text.primary'));
});
