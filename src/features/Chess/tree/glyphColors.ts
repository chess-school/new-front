import { tokens } from '@/theme/tokens';

/** Цвета глифов, как на Lichess: хорошие — зелёные, ошибки — тёплые */
export const GLYPH_COLORS: Record<string, string> = {
  '!': tokens.accent.emerald,
  '!!': '#2dd4bf',
  '!?': '#c084fc',
  '?!': tokens.accent.blue,
  '?': '#f0883e',
  '??': tokens.accent.red,
};
