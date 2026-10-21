import React from 'react';
import { Box, Tooltip } from '@mui/material';

import { AnalysisResult } from '../engine/stockfish';
import { formatEvalShort, whitePercent } from '../engine/evaluation';
import { tokens } from '@/theme/tokens';

interface EvalBarProps {
  result: AnalysisResult | null | undefined;
  /** Сторона внизу доски: шкала переворачивается вместе с доской */
  orientation?: 'white' | 'black';
  /** vertical — рядом с доской (высота от родителя), horizontal — под доской на телефоне */
  direction?: 'vertical' | 'horizontal';
  /** Толщина шкалы, px */
  width?: number;
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Шкала оценки в стиле Lichess: бежевая часть белых растёт от их края, доля — «шансы на победу»
 * по сигмоиде Lichess; живая цифра — у края стороны с перевесом.
 */
export const EvalBar: React.FC<EvalBarProps> = ({ result, orientation = 'white', direction = 'vertical', width }) => {
  const white = whitePercent(result);
  const label = formatEvalShort(result);
  const whiteAhead = white >= 50;
  const vertical = direction === 'vertical';
  const thickness = width ?? (vertical ? 24 : 18);
  // Белые снизу (слева на горизонтальной), если доска повёрнута за белых
  const whiteAtStart = orientation === 'white';
  const whiteEdge = vertical ? (whiteAtStart ? 'bottom' : 'top') : (whiteAtStart ? 'left' : 'right');
  const blackEdge = { bottom: 'top', top: 'bottom', left: 'right', right: 'left' }[whiteEdge];
  const labelEdge = whiteAhead ? whiteEdge : blackEdge;

  return (
    <Tooltip title={label || '…'} placement={vertical ? 'left' : 'top'}>
      <Box
        role="meter"
        aria-label="evaluation"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(white)}
        aria-valuetext={label}
        aria-orientation={direction}
        data-testid="eval-bar"
        sx={{
          position: 'relative',
          ...(vertical
            ? { width: thickness, minWidth: thickness, height: '100%', minHeight: 120 }
            : { height: thickness, width: '100%' }),
          bgcolor: tokens.evalBar.black,
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.5), 0 0 0 1px ${tokens.border.subtle}`,
        }}
      >
        <Box
          data-testid="eval-bar-white"
          sx={{
            position: 'absolute',
            [whiteEdge]: 0,
            ...(vertical ? { left: 0, right: 0, height: `${white}%` } : { top: 0, bottom: 0, width: `${white}%` }),
            background: `linear-gradient(${vertical ? '90deg' : '180deg'}, ${tokens.evalBar.white} 0%, #ddd5c6 100%)`,
            transition: `${vertical ? 'height' : 'width'} 0.7s ${EASE}`,
          }}
        />
        {/* Середина шкалы (равенство) */}
        <Box sx={{
          position: 'absolute',
          ...(vertical ? { left: 0, right: 0, top: '50%', height: '1px' } : { top: 0, bottom: 0, left: '50%', width: '1px' }),
          bgcolor: 'rgba(227, 179, 65, 0.55)',
        }} />
        {label && (
          <Box
            component="span"
            data-testid="eval-bar-label"
            sx={{
              position: 'absolute',
              [labelEdge]: vertical ? 3 : 6,
              ...(vertical ? { left: 0, right: 0, textAlign: 'center' } : { top: 0, bottom: 0, display: 'flex', alignItems: 'center' }),
              fontFamily: tokens.font.mono,
              fontSize: vertical ? 10 : 11,
              fontWeight: 700,
              lineHeight: vertical ? '14px' : 1,
              letterSpacing: '-0.02em',
              color: whiteAhead ? '#1f1d1a' : tokens.evalBar.white,
              transition: 'color .3s ease',
            }}
          >
            {label}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};
