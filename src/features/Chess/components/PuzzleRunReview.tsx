import React, { useState } from 'react';
import { Box, Chip, List, ListItemButton, ListItemIcon, ListItemText, Paper, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { useTranslation } from 'react-i18next';

import { IPuzzle } from '@/types/Puzzles';
import { tokens } from '@/theme/tokens';
import { PuzzleAnalysis } from './PuzzleAnalysis';

export interface RunAttempt {
  puzzle: IPuzzle;
  solved: boolean;
  /** Сколько ходов линии успели сыграть — с этой позиции открывается разбор */
  playedPlies: number;
}

const sideOf = (puzzle: IPuzzle): 'white' | 'black' => {
  const turn = puzzle.fen.split(' ')[1];
  // У Lichess первый ход — соперника, решает другая сторона
  const solver = puzzle.startsWithOpponentMove ? (turn === 'w' ? 'b' : 'w') : turn;
  return solver === 'w' ? 'white' : 'black';
};

/** Разбор забега («Рейтинг», «Выживание»): задачи забега и доска разбора выбранной */
export const PuzzleRunReview: React.FC<{ attempts: RunAttempt[] }> = ({ attempts }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(attempts.length ? attempts.length - 1 : -1);
  const current = attempts[selected];
  const solved = attempts.filter((a) => a.solved).length;

  if (!attempts.length) return null;
  return (
    <Paper sx={{ mt: { xs: 3, md: 4 }, p: { xs: 2, md: 3 } }} data-testid="run-review">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('puzzleRun.reviewTitle')}</Typography>
        <Chip size="small" label={`${solved} / ${attempts.length}`} sx={{ fontFamily: tokens.font.mono, fontWeight: 700 }} />
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' }, gap: 3 }}>
        <List dense disablePadding sx={{ maxHeight: { xs: 220, md: 560 }, overflowY: 'auto', pr: 0.5 }}>
          {attempts.map((a, i) => (
            <ListItemButton key={`${a.puzzle._id}-${i}`} selected={i === selected} onClick={() => setSelected(i)}
              sx={{ mb: 0.5, border: 1, borderColor: i === selected ? 'transparent' : 'divider' }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {a.solved
                  ? <CheckCircleRoundedIcon fontSize="small" sx={{ color: tokens.accent.emerald }} />
                  : <CancelRoundedIcon fontSize="small" sx={{ color: tokens.accent.red }} />}
              </ListItemIcon>
              <ListItemText
                primary={a.puzzle.source.kind === 'book' ? `${a.puzzle.source.title}` : `#${i + 1}`}
                secondary={a.puzzle.source.kind === 'book' ? a.puzzle.source.bookTitle : `${t('puzzles.ratingLabel')} ${a.puzzle.rating}`}
                primaryTypographyProps={{ fontWeight: 600 }}
                secondaryTypographyProps={{ color: 'text.secondary', noWrap: true }}
              />
            </ListItemButton>
          ))}
        </List>
        {current && (
          <Box sx={{ minWidth: 0, maxWidth: 640 }}>
            <Chip
              size="small"
              icon={current.solved ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
              label={t(current.solved ? 'puzzleRun.solved' : 'puzzleRun.failed')}
              sx={{
                mb: 1.5, fontWeight: 700,
                color: current.solved ? tokens.accent.emerald : tokens.accent.red,
                bgcolor: current.solved ? tokens.accent.emeraldSoft : tokens.accent.redSoft,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
            <PuzzleAnalysis
              key={`${current.puzzle._id}-${selected}`}
              puzzle={current.puzzle}
              initialPly={current.playedPlies}
              orientation={sideOf(current.puzzle)}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};
