import React from 'react';
import { Typography, Box, Tooltip } from '@mui/material';
import { IOpeningMove } from '@/types/Opening';
import { tokens } from '@/theme/tokens';

interface OpeningMoveBarProps {
  moveData: IOpeningMove;
  totalGames: number;
  onMoveClick: (san: string) => void;
}

/** Строка дебютной книги: ход, число партий и полоса «победы белых / ничьи / победы чёрных» */
export const OpeningMoveBar: React.FC<OpeningMoveBarProps> = ({ moveData, totalGames, onMoveClick }) => {
  if (totalGames === 0 || moveData.games === 0) return null;

  const { san, games, wins, draws } = moveData;
  const winPercent = (wins / games) * 100;
  const drawPercent = (draws / games) * 100;
  const lossPercent = Math.max(0, 100 - winPercent - drawPercent);
  const pct = (v: number) => (v >= 12 ? `${Math.round(v)}%` : '');

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onMoveClick(san)}
      sx={{
        all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
        display: 'grid', gridTemplateColumns: '3.5rem 4.5rem 1fr', alignItems: 'center', gap: 1.5,
        px: 1, py: 0.75, borderRadius: 1, mb: 0.25,
        '&:hover': { bgcolor: 'action.hover' },
        '&:focus-visible': { outline: `2px solid ${tokens.accent.gold}`, outlineOffset: -2 },
      }}
    >
      <Typography fontWeight={700} noWrap>{san}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', fontFamily: tokens.font.mono, fontSize: '0.8rem' }}>
        {games.toLocaleString()}
      </Typography>
      <Tooltip title={`${Math.round(winPercent)}% / ${Math.round(drawPercent)}% / ${Math.round(lossPercent)}%`}>
        <Box sx={{ display: 'flex', height: 18, borderRadius: '5px', overflow: 'hidden', fontSize: 10, fontWeight: 700, lineHeight: '18px', fontFamily: tokens.font.mono }}>
          <Box sx={{ width: `${winPercent}%`, bgcolor: tokens.evalBar.white, color: '#1f1d1a', textAlign: 'center' }}>{pct(winPercent)}</Box>
          <Box sx={{ width: `${drawPercent}%`, bgcolor: '#6e7681', color: '#f0f6fc', textAlign: 'center' }}>{pct(drawPercent)}</Box>
          <Box sx={{ width: `${lossPercent}%`, bgcolor: tokens.evalBar.black, color: '#f0f6fc', textAlign: 'center' }}>{pct(lossPercent)}</Box>
        </Box>
      </Tooltip>
    </Box>
  );
};
