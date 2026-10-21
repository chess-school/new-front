import React from 'react';
import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { useTranslation } from 'react-i18next';
import { PuzzleSourceFilter } from '@/types/Puzzles';
import { tokens } from '@/theme/tokens';
import { PuzzleSourcePicker } from './PuzzleSourcePicker';

interface RunStartCardProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  /** Итоги прошлого забега */
  stats?: React.ReactNode;
  source: PuzzleSourceFilter;
  onSourceChange: (value: PuzzleSourceFilter) => void;
  startLabel: string;
  onStart: () => void;
  /** Забег запущен, первая задача ещё грузится */
  starting?: boolean;
}

/** Стартовый экран забега («Рейтинг», «Выживание»): выбор источника задач и запуск; после забега — итоги */
export const RunStartCard: React.FC<RunStartCardProps> = ({
  icon, title, description, stats, source, onSourceChange, startLabel, onStart, starting,
}) => {
  const { t } = useTranslation();
  return (
    <Paper sx={{
      p: { xs: 3, md: 5 }, maxWidth: 720, mx: 'auto', textAlign: 'center', position: 'relative', overflow: 'hidden',
      background: `radial-gradient(120% 80% at 50% 0%, ${tokens.accent.goldSoft} 0%, transparent 60%)`,
    }}>
      <Box sx={{
        width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: 3, display: 'grid', placeItems: 'center',
        bgcolor: tokens.accent.goldSoft, color: 'primary.main', '& svg': { fontSize: 34 },
      }}>
        {icon}
      </Box>
      <Typography variant="h4" component="h2">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 520, mx: 'auto' }}>{description}</Typography>
      {stats && <Box sx={{ mt: 3, textAlign: 'left' }}>{stats}</Box>}
      <Stack spacing={1} alignItems="center" sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t('puzzles.sourceLabel', 'Puzzle source')}
        </Typography>
        <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <PuzzleSourcePicker value={source} onChange={onSourceChange} disabled={starting} />
        </Box>
      </Stack>
      <Button variant="contained" size="large" onClick={onStart} disabled={starting}
        startIcon={starting ? <CircularProgress size={18} color="inherit" /> : <PlayArrowRoundedIcon />}
        sx={{ mt: 3, minWidth: 220 }}>
        {startLabel}
      </Button>
    </Paper>
  );
};
