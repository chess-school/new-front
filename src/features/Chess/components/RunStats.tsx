import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens';

export type StatTone = 'gold' | 'emerald' | 'red' | 'blue';

export interface RunStat {
  key: string;
  label: string;
  value: React.ReactNode;
  icon?: React.ReactElement;
  tone?: StatTone;
}

const TONES: Record<StatTone, { fg: string; bg: string }> = {
  gold: { fg: tokens.accent.gold, bg: tokens.accent.goldSoft },
  emerald: { fg: tokens.accent.emerald, bg: tokens.accent.emeraldSoft },
  red: { fg: tokens.accent.red, bg: tokens.accent.redSoft },
  blue: { fg: tokens.accent.blue, bg: tokens.accent.blueSoft },
};

/** Стат-плашки забега («Рейтинг», «Выживание»): время, счёт, рейтинг */
export const RunStats: React.FC<{ stats: RunStat[] }> = ({ stats }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`, gap: 1 }}>
    {stats.map(({ key, label, value, icon, tone = 'gold' }) => (
      <Box key={key} data-testid={`stat-${key}`} data-value={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
        sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2, bgcolor: 'surface.raised', border: 1, borderColor: 'divider', minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: TONES[tone].fg, mb: 0.5, '& svg': { fontSize: 16 } }}>
          {icon}
          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </Typography>
        </Stack>
        <Typography sx={{ fontFamily: tokens.font.mono, fontWeight: 700, fontSize: { xs: '1.35rem', sm: '1.6rem' }, lineHeight: 1.1, color: 'text.primary' }}>
          {value}
        </Typography>
      </Box>
    ))}
  </Box>
);

/** Бейдж статуса задачи: решено — изумрудный, ошибка — красный, нейтральный — янтарный */
export const StatusBadge: React.FC<{ tone: StatTone | 'neutral'; icon?: React.ReactElement; children: React.ReactNode; testId?: string }> = ({ tone, icon, children, testId }) => {
  const colors = tone === 'neutral' ? { fg: tokens.text.primary, bg: 'action.hover' } : TONES[tone];
  return (
    <Stack direction="row" spacing={1} alignItems="center"
      sx={{ px: 1.5, py: 1.1, borderRadius: 2, bgcolor: colors.bg, color: colors.fg, border: 1, borderColor: tone === 'neutral' ? 'divider' : 'transparent', transition: 'background-color .25s ease, color .25s ease' }}>
      {icon && <Box sx={{ display: 'flex', '& svg': { fontSize: 20 } }}>{icon}</Box>}
      <Typography component="div" fontWeight={700} data-testid={testId} sx={{ minHeight: '1.5em' }}>{children}</Typography>
    </Stack>
  );
};
