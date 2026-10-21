import React from 'react';
import { Box, Chip, CircularProgress, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { AnalysisResult, EngineLine, formatScore, pvToSan } from '../engine/stockfish';
import { tokens } from '@/theme/tokens';

interface EnginePanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  result: AnalysisResult | null;
  analyzing: boolean;
  engineName?: string;
  error?: string | null;
  /** Сколько линий показывать (MultiPV) */
  maxLines?: number;
}

/** Цвет оценки линии: перевес чёрных — мягкий красный, белых — светлый */
const scoreColor = (line: Pick<EngineLine, 'scoreCp' | 'mate'> | undefined) => {
  if (!line) return 'text.secondary';
  const negative = line.mate !== undefined ? line.mate < 0 : (line.scoreCp ?? 0) < 0;
  return negative ? tokens.accent.red : tokens.text.primary;
};

/** Оценка позиции и лучшие линии движка */
export const EnginePanel: React.FC<EnginePanelProps> = ({ enabled, onToggle, result, analyzing, engineName, error, maxLines = 3 }) => {
  const { t } = useTranslation();
  const best = result?.lines[0];

  return (
    <Box sx={{ bgcolor: 'surface.raised', border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <FormControlLabel
          sx={{ mr: 0 }}
          control={<Switch size="small" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />}
          label={<Typography variant="body2" fontWeight={600}>{t('engine.analysis')}</Typography>}
        />
        {enabled && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            {analyzing && <CircularProgress size={12} thickness={6} />}
            <Typography variant="caption" color="text.secondary" noWrap>{engineName}</Typography>
            {!!result?.depth && (
              <Chip size="small" label={t('engine.depth', { depth: result.depth })}
                sx={{ height: 20, fontSize: '0.72rem', fontFamily: tokens.font.mono, bgcolor: 'surface.overlay' }} />
            )}
          </Stack>
        )}
      </Stack>
      {enabled && error && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{t('engine.error')}</Typography>}
      {enabled && !error && (
        <Box sx={{ mt: 1 }}>
          <Typography data-testid="engine-eval" sx={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.2, color: scoreColor(best) }}>
            {best ? formatScore(best) : '…'}
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 0.75 }}>
            {result?.lines.slice(0, maxLines).map((line) => (
              <Stack key={line.multipv} data-testid="engine-line" direction="row" spacing={1} alignItems="baseline"
                sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'background.paper', minWidth: 0 }}>
                <Box component="span" sx={{ fontFamily: tokens.font.mono, fontSize: '0.8rem', fontWeight: 700, color: scoreColor(line), minWidth: '3.6em' }}>
                  {formatScore(line)}
                </Box>
                <Typography variant="body2" noWrap sx={{ fontFamily: tokens.font.mono, fontSize: '0.82rem', color: 'text.secondary', minWidth: 0 }}>
                  {pvToSan(result.fen, line.pv, 8)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
