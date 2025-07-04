// src/features/Chess/components/VariationLine.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Chess, Square } from 'chess.js';

interface VariationLineProps {
  uciLine: string;
  startFen: string;
  onMoveHover: (from: Square, to: Square) => void;
  onMoveLeave: () => void;
  onMoveClick: (fen: string) => void;
}

interface ParsedMove {
  san: string;
  fen: string;
  from: Square;
  to: Square;
}

export const VariationLine: React.FC<VariationLineProps> = ({
  uciLine,
  startFen,
  onMoveHover,
  onMoveLeave,
  onMoveClick,
}) => {
  const parsedMoves = useMemo(() => {
    if (!uciLine) return [];

    try {
      const tempGame = new Chess(startFen);
      const moves = uciLine.split(' ');
      const result: ParsedMove[] = [];

      for (const uci of moves) {
        const moveResult = tempGame.move({
          from: uci.substring(0, 2) as Square,
          to: uci.substring(2, 4) as Square,
          promotion: uci.length === 5 ? uci.substring(4) : undefined,
        });

        if (moveResult) {
          result.push({
            san: moveResult.san,
            fen: tempGame.fen(),
            from: moveResult.from,
            to: moveResult.to,
          });
        } else {
          break;
        }
      }
      return result;
    } catch (e) {
      return [];
    }
  }, [uciLine, startFen]);

  return (
    <Box 
      onMouseLeave={onMoveLeave}
      sx={{ display: 'flex', flexWrap: 'wrap', gap: '0 8px', whiteSpace: 'normal', lineHeight: '1.8' }}
    >
      {parsedMoves.map((move, index) => (
        <Typography
          key={index}
          component="span"
          onClick={() => onMoveClick(move.fen)}
          onMouseEnter={() => onMoveHover(move.from, move.to)}
          sx={{
            cursor: 'pointer',
            p: '1px 4px',
            borderRadius: '4px',
            '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.3)' },
          }}
        >
          {index > 0 && index % 2 === 0 && `${Math.floor(index / 2) + 1}. `}
          {move.san}
        </Typography>
      ))}
    </Box>
  );
};