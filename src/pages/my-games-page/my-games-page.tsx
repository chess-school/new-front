import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { getMyGames } from '@/features/Play/playApi';
import { Color, MyGame } from '@/features/Play/playTypes';

type Outcome = 'win' | 'loss' | 'draw' | 'aborted';

const outcomeOf = (game: MyGame, myColor: Color): Outcome => {
  if (game.status === 'aborted') return 'aborted';
  if (game.winner === 'draw' || game.winner === null) return 'draw';
  return game.winner === myColor ? 'win' : 'loss';
};

const OUTCOME_STYLE: Record<Outcome, { color: 'success' | 'error' | 'default' | 'warning'; letter: string }> = {
  win: { color: 'success', letter: 'W' },
  loss: { color: 'error', letter: 'L' },
  draw: { color: 'default', letter: '½' },
  aborted: { color: 'warning', letter: '–' },
};

const timeControlLabel = (tc: MyGame['timeControl']) => {
  const minutes = tc.initialSeconds % 60 === 0 ? tc.initialSeconds / 60 : (tc.initialSeconds / 60).toFixed(1);
  return `${minutes}+${tc.incrementSeconds}`;
};

/** Список сыгранных на сайте онлайн-партий текущего пользователя. */
export const MyGamesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState<MyGame[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setGames(await getMyGames(50));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const myColorOf = (game: MyGame): Color => (game.white?.uuid === user?.uuid ? 'white' : 'black');

  return (
    <PageContainer maxWidth={900}>
      <PageHeader
        eyebrow={t('nav.groups.my', 'My learning')}
        title={t('myGames.title', 'My games')}
        subtitle={t('myGames.subtitle', 'Online games you have played on the site')}
        actions={<Button variant="contained" onClick={() => navigate('/play')}>{t('myGames.playNew', 'Play a game')}</Button>}
      />

      {status === 'loading' && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>
      )}

      {status === 'error' && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void load()}>{t('myGames.retry', 'Retry')}</Button>}>
          {t('myGames.loadFailed', 'Failed to load your games')}
        </Alert>
      )}

      {status === 'ready' && games.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{t('myGames.empty', 'You have not played any games yet')}</Typography>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/play')}>{t('myGames.playNew', 'Play a game')}</Button>
        </Box>
      )}

      {status === 'ready' && games.length > 0 && (
        <Stack spacing={1.25}>
          {games.map((game) => {
            const myColor = myColorOf(game);
            const opponent = myColor === 'white' ? game.black : game.white;
            const outcome = outcomeOf(game, myColor);
            const style = OUTCOME_STYLE[outcome];
            const diff = game.isRated ? game.ratingChanges?.[myColor] ?? null : null;
            return (
              <Paper
                key={game._id}
                onClick={() => navigate(`/play/${game._id}`)}
                sx={{
                  p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, cursor: 'pointer',
                  transition: 'border-color .15s ease, transform .15s ease',
                  '&:hover': { borderColor: 'rgba(138,43,43,0.35)', transform: 'translateY(-1px)' },
                }}
              >
                <Box sx={{
                  width: 40, height: 40, flexShrink: 0, borderRadius: 1.5, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '1.1rem',
                  bgcolor: (th) => (style.color === 'default' ? th.palette.action.selected : th.palette[style.color].main),
                  color: (th) => (style.color === 'default' ? th.palette.text.primary : th.palette.getContrastText(th.palette[style.color].main)),
                }}>
                  {style.letter}
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography fontWeight={600} noWrap>
                      {t('myGames.vs', 'vs')} {opponent ? `${opponent.firstName} ${opponent.lastName}` : t('myGames.unknownOpponent', 'Unknown')}
                    </Typography>
                    <Chip size="small" variant="outlined" label={t(`myGames.outcome.${outcome}`, outcome)} color={style.color === 'warning' ? 'warning' : style.color} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {t(`myGames.color.${myColor}`, myColor)} · {timeControlLabel(game.timeControl)} {t(`play.speed.${game.timeControl.type}`, game.timeControl.type)}
                    {' · '}{game.isRated ? t('myGames.rated', 'Rated') : t('myGames.casual', 'Casual')}
                    {game.endReason ? ` · ${t(`myGames.endReason.${game.endReason}`, game.endReason.replace(/_/g, ' '))}` : ''}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  {diff !== null && (
                    <Typography variant="body2" fontWeight={700} sx={{ color: diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary' }}>
                      {diff > 0 ? `+${diff}` : diff}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {game.finishedAt ? new Date(game.finishedAt).toLocaleDateString() : ''}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}
    </PageContainer>
  );
};

export default MyGamesPage;
