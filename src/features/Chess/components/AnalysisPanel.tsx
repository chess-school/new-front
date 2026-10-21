import React from 'react';
import { Box, Chip, CircularProgress, Stack, Switch, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { tokens } from '@/theme/tokens';

interface AnalysisPanelProps {
  evaluation: string | null;
  depth: number;
  principalVariation: string; // Теперь это будет отформатированная строка SAN
  isAnalyzing: boolean;
  isEngineOn: boolean;
  onToggleEngine: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Имя движка из ответа UCI 'id name' (в public/workers сейчас Stockfish 2018, asm.js) */
  engineName?: string;
}

/** Цвет оценки: перевес белых — светлый, чёрных — мягкий красный, равенство — янтарный */
const evalColor = (evaluation: string | null) => {
  if (!evaluation) return 'text.secondary';
  if (evaluation.startsWith('-')) return tokens.accent.red;
  if (evaluation === '0.00') return tokens.accent.gold;
  return tokens.text.primary;
};

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  evaluation,
  depth,
  principalVariation,
  isAnalyzing,
  isEngineOn,
  onToggleEngine,
  engineName,
}) => {
  const { t } = useTranslation();
  return (
    <Box data-testid="analysis-panel">
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Typography
            data-testid="live-eval"
            sx={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: '1.9rem', lineHeight: 1, color: isEngineOn ? evalColor(evaluation) : 'text.disabled', minWidth: '4.5ch' }}
          >
            {isEngineOn ? evaluation ?? '…' : '—'}
          </Typography>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{engineName ?? 'Stockfish'}</Typography>
            <Stack direction="row" spacing={0.75} alignItems="center">
              {isEngineOn && (
                <Chip size="small" label={t('engine.depth', { depth })} data-testid="live-depth"
                  sx={{ height: 20, fontSize: '0.72rem', fontFamily: tokens.font.mono, bgcolor: 'surface.overlay' }} />
              )}
              {isEngineOn && isAnalyzing && <CircularProgress size={12} thickness={6} />}
            </Stack>
          </Box>
        </Stack>
        <Switch checked={isEngineOn} onChange={onToggleEngine} inputProps={{ 'aria-label': t('engine.analysis') }} />
      </Stack>
      {isEngineOn && (
        <Box sx={{ mt: 1.5, px: 1.25, py: 1, borderRadius: 1, bgcolor: 'surface.raised', minHeight: '2.6em', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <Typography variant="body2" sx={{ fontFamily: tokens.font.mono, color: principalVariation ? 'text.primary' : 'text.secondary' }}>
            {principalVariation || (isAnalyzing ? t('chessGame.analysis.analyzing') : '—')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
