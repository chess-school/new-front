import React from 'react';
import { Box, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { useTranslation } from 'react-i18next';
import { RatingCategory, User } from '@/types/User';

const CATEGORIES: Array<{ key: RatingCategory; icon: React.ReactElement; fallback: string }> = [
  { key: 'bullet', icon: <FlashOnRoundedIcon />, fallback: 'Bullet' },
  { key: 'blitz', icon: <BoltRoundedIcon />, fallback: 'Blitz' },
  { key: 'rapid', icon: <TimerRoundedIcon />, fallback: 'Rapid' },
  { key: 'classical', icon: <AccessTimeRoundedIcon />, fallback: 'Classical' },
];

interface ProfileStatsProps {
  user: User;
}

/** Рейтинги онлайн-партий (Glicko-2) по категориям контроля времени. */
export const ProfileStats: React.FC<ProfileStatsProps> = ({ user }) => {
  const { t } = useTranslation();
  const ratings = user.ratings;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>{t('profile.ratingsTitle', 'Online ratings')}</Typography>
      <Grid container spacing={2}>
        {CATEGORIES.map(({ key, icon, fallback }) => {
          const perf = ratings?.[key];
          const played = (perf?.games ?? 0) > 0;
          return (
            <Grid item xs={6} md={3} key={key}>
              <Paper sx={{
                p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1,
                background: 'radial-gradient(ellipse 80% 120% at 0% 0%, rgba(var(--accent-rgb),0.08), transparent 60%)',
              }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'primary.main' }}>
                  {icon}
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
                    {t(`profile.rating.${key}`, fallback)}
                  </Typography>
                </Stack>
                {/* Без сыгранных партий показываем «—» + подсказку, а не приглушённый серым «1500»
                    (который читался как неактивный элемент, контраст 2.55:1). */}
                {played ? (
                  <>
                    <Stack direction="row" alignItems="baseline" spacing={0.75}>
                      <Typography sx={{ fontWeight: 700, fontSize: '2rem', lineHeight: 1.1, color: 'text.primary' }}>
                        {Math.round(perf!.rating)}
                      </Typography>
                      <Tooltip title={t('profile.rdHint', 'Rating deviation — lower means a more reliable rating')} arrow>
                        <Typography variant="body2" color="text.secondary">±{Math.round(perf!.rd)}</Typography>
                      </Tooltip>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {t('profile.gamesCount', { count: perf!.games, defaultValue: '{{count}} rated games' })}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontWeight: 700, fontSize: '2rem', lineHeight: 1.1, color: 'text.secondary' }} aria-hidden>
                      —
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('profile.noRatingHint', 'Play rated games to get a rating')}
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
