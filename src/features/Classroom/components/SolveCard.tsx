import React, { useEffect, useState } from 'react';
import { Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { useTranslation } from 'react-i18next';
import { SolveState } from '../classroomApi';

interface SolveCardProps {
  solve: SolveState;
  canControl: boolean;
  isCoach: boolean;
  onHint: () => void;
  onRestart: () => void;
  onExit: () => void;
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Карточка активной задачи (Solve Mode) на общей доске: статус, таймер, подсказка/сброс/выход. */
export const SolveCard: React.FC<SolveCardProps> = ({ solve, canControl, isCoach, onHint, onRestart, onExit }) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (solve.status !== 'solving') return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [solve.status]);

  const started = Date.parse(solve.startedAt);
  const elapsed = Number.isFinite(started) ? Math.max(0, Math.floor((now - started) / 1000)) : 0;
  const solved = solve.status === 'solved';
  const movesDone = Math.floor(solve.index / 2);
  const movesTotal = Math.ceil(solve.total / 2);

  return (
    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'surface.raised', border: 1, borderColor: solved ? 'success.main' : 'divider' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {solved ? <CheckCircleRoundedIcon color="success" /> : <ExtensionRoundedIcon color="primary" />}
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, minWidth: 0 }} noWrap>
          {solve.title || t('classroom.solve.title', { defaultValue: 'Puzzle solution' })}
        </Typography>
        <Chip size="small" variant="outlined" label={fmt(elapsed)} sx={{ fontVariantNumeric: 'tabular-nums' }} />
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Chip
          size="small"
          color={solve.sideToMove === 'w' ? 'default' : 'default'}
          label={solve.sideToMove === 'w'
            ? t('classroom.solve.whiteToMove', { defaultValue: 'White to move' })
            : t('classroom.solve.blackToMove', { defaultValue: 'Black to move' })}
        />
        {solve.wrong > 0 && !solved && (
          <Typography variant="body2" color="error.main">
            {t('classroom.solve.wrong', { defaultValue: 'Mistakes' })}: {solve.wrong}
          </Typography>
        )}
      </Stack>

      {solved ? (
        <Stack spacing={1} sx={{ mb: 1 }}>
          <Typography variant="body2" color="success.main" fontWeight={600}>
            {t('classroom.solve.solved', { defaultValue: 'Puzzle solved! 🎉' })}
          </Typography>
          {isCoach && (
            <Button size="small" variant="contained" color="success" startIcon={<AutoFixHighRoundedIcon />} onClick={onExit}>
              {t('classroom.solve.analyze', { defaultValue: 'Analyse position' })}
            </Button>
          )}
        </Stack>
      ) : (
        <Box sx={{ mb: 1 }}>
          <LinearProgress variant="determinate" aria-label={t('classroom.solve.progress', { defaultValue: 'Moves found' })} value={movesTotal ? (movesDone / movesTotal) * 100 : 0} sx={{ borderRadius: 1, height: 6 }} />
          <Typography variant="caption" color="text.secondary">
            {t('classroom.solve.progress', { defaultValue: 'Moves found' })}: {movesDone}/{movesTotal}
          </Typography>
        </Box>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {canControl && !solved && (
          <Button size="small" variant="outlined" color="warning" startIcon={<LightbulbRoundedIcon />} onClick={onHint}>
            {t('classroom.solve.hint', { defaultValue: 'Hint' })}
          </Button>
        )}
        {canControl && (
          <Button size="small" variant="outlined" color="inherit" startIcon={<RestartAltRoundedIcon />} onClick={onRestart}>
            {t('classroom.solve.restart', { defaultValue: 'From start' })}
          </Button>
        )}
        {isCoach && !solved && (
          <Button size="small" variant="text" color="inherit" startIcon={<CloseRoundedIcon />} onClick={onExit}>
            {t('classroom.solve.exit', { defaultValue: 'Exit solving' })}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default SolveCard;
