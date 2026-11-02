import { tokens } from '@/theme/tokens';

/** Оформление react-chessboard в редакторе — как у общей ChessBoard платформы */
export const boardStyleProps = {
  customBoardStyle: { borderRadius: '10px', overflow: 'hidden', boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.06)' },
  customDarkSquareStyle: { backgroundColor: tokens.board.dark },
  customLightSquareStyle: { backgroundColor: tokens.board.light },
  // Координаты — «тихая служебная» типографика как у общего компонента (размер оставляем дефолтный
  // react-chessboard ≈ width/48, он совпадает с нашим ~0.17 клетки): моноширинный, обычный вес, без тени.
  customNotationStyle: {
    fontWeight: 600,
    fontFamily: tokens.font.mono,
    fontVariantNumeric: 'tabular-nums',
    textShadow: 'none',
    lineHeight: 1,
  },
};

/** Стрелка лучшего хода движка */
export const ENGINE_ARROW = 'rgba(88, 166, 255, 0.85)';
