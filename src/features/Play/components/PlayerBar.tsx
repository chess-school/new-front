import React, { useEffect, useState } from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ClockState, Color, PlayPlayer } from '../playTypes';
import { formatClock, LOW_TIME_MS, remainingMs } from '../clock';
import { tokens } from '@/theme/tokens';

interface PlayerBarProps {
  player: PlayPlayer | null;
  color: Color;
  clock: ClockState;
  receivedAt: number;
  /** Партия идёт (часы могут тикать) */
  live: boolean;
  /** Изменение рейтинга после партии */
  ratingDiff?: number | null;
  isMe?: boolean;
}

/** Часы с живым отсчётом: перерисовка 10 раз в секунду, только пока идут */
export const GameClock: React.FC<{ clock: ClockState; color: Color; receivedAt: number; live: boolean }> = ({ clock, color, receivedAt, live }) => {
  const ticking = live && clock.running && clock.turn === color;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [ticking]);
  const ms = remainingMs(clock, color, receivedAt, ticking ? now : receivedAt, !live);
  const low = ms < LOW_TIME_MS && live;
  return (
    <Box
      data-testid={`clock-${color}`}
      data-low={low ? 'true' : 'false'}
      aria-label={`${color} clock`}
      sx={{
        fontFamily: tokens.font.mono, fontWeight: 700, fontSize: { xs: '1.35rem', sm: '1.6rem' }, lineHeight: 1,
        px: 1.5, py: 1, borderRadius: 2, minWidth: 96, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
        transition: 'background-color .2s ease, color .2s ease',
        bgcolor: low ? tokens.accent.redSoft : ticking ? tokens.accent.goldSoft : 'surface.raised',
        color: low ? tokens.accent.red : ticking ? 'text.primary' : 'text.secondary',
        border: 1, borderColor: low ? 'rgba(248,81,73,0.5)' : ticking ? 'rgba(227,179,65,0.45)' : 'divider',
        animation: low && ticking ? 'clockPulse 1s ease-in-out infinite' : 'none',
        '@keyframes clockPulse': { '50%': { boxShadow: `0 0 0 3px ${tokens.accent.redSoft}` } },
      }}
    >
      {formatClock(ms)}
    </Box>
  );
};

/** Карточка игрока над/под доской: аватар, имя, рейтинг (± после партии), часы */
export const PlayerBar: React.FC<PlayerBarProps> = ({ player, color, clock, receivedAt, live, ratingDiff, isMe }) => {
  const { t } = useTranslation();
  const name = player ? `${player.firstName} ${player.lastName}`.trim() : t('play.waitingOpponent', 'Waiting for opponent…');
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} data-testid={`player-${color}`} sx={{ py: 0.75, minWidth: 0 }}>
      <Box sx={{ position: 'relative' }}>
        <Avatar src={player?.avatarUrl || undefined} sx={{ width: 40, height: 40, bgcolor: 'surface.overlay', color: 'primary.main', fontWeight: 700 }}>
          {player ? `${player.firstName[0] ?? ''}${player.lastName[0] ?? ''}` : '?'}
        </Avatar>
        {/* Цвет фигур игрока */}
        <Box sx={{
          position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: '50%',
          bgcolor: color === 'white' ? tokens.evalBar.white : tokens.evalBar.black, border: 2, borderColor: 'background.paper',
        }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={600} noWrap>
          {name}{isMe && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> · {t('play.you', 'you')}</Box>}
        </Typography>
        {player && (
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: tokens.font.mono }}>
            {player.rating}{player.provisional ? '?' : ''}
            {typeof ratingDiff === 'number' && (
              <Box component="span" data-testid={`rating-diff-${color}`} sx={{ ml: 1, fontWeight: 700, color: ratingDiff > 0 ? 'success.main' : ratingDiff < 0 ? 'error.main' : 'text.secondary' }}>
                {ratingDiff > 0 ? `+${ratingDiff}` : ratingDiff}
              </Box>
            )}
          </Typography>
        )}
      </Box>
      <GameClock clock={clock} color={color} receivedAt={receivedAt} live={live} />
    </Stack>
  );
};
