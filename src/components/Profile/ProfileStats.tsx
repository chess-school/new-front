import React from 'react';
import { Box, Chip, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
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

/** Рейтинги онлайн-партий (Glicko-2) по категориям и сведения об аккаунте. */
export const ProfileStats: React.FC<ProfileStatsProps> = ({ user }) => {
  const { t } = useTranslation();
  const ratings = user.ratings;

  const info: Array<{ icon: React.ReactElement; label: string; value: React.ReactNode }> = [
    { icon: <EmailRoundedIcon fontSize="small" />, label: t('profile.email', 'Email'), value: user.email },
    ...(user.phone ? [{ icon: <PhoneRoundedIcon fontSize="small" />, label: t('profile.phone', 'Phone'), value: user.phone }] : []),
    {
      icon: <BadgeRoundedIcon fontSize="small" />,
      label: t('profile.roles', 'Roles'),
      value: (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {user.roles.map((r) => <Chip key={r} label={r} size="small" variant="outlined" />)}
        </Stack>
      ),
    },
    { icon: <CalendarMonthRoundedIcon fontSize="small" />, label: t('profile.registrationDate', 'Member since'), value: new Date(user.createdAt).toLocaleDateString() },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{t('profile.ratingsTitle', 'Online ratings')}</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {CATEGORIES.map(({ key, icon, fallback }) => {
          const perf = ratings?.[key];
          const played = (perf?.games ?? 0) > 0;
          return (
            <Grid item xs={6} md={3} key={key}>
              <Paper sx={{
                p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1,
                background: 'radial-gradient(ellipse 80% 120% at 0% 0%, rgba(138,43,43,0.10), transparent 60%)',
              }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'primary.main' }}>
                  {icon}
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem' }}>
                    {t(`profile.rating.${key}`, fallback)}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="baseline" spacing={0.75}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: played ? 'text.primary' : 'text.disabled' }}>
                    {Math.round(perf?.rating ?? 1500)}
                  </Typography>
                  {perf && (
                    <Tooltip title={t('profile.rdHint', 'Rating deviation — lower means a more reliable rating')} arrow>
                      <Typography variant="body2" color="text.secondary">±{Math.round(perf.rd)}</Typography>
                    </Tooltip>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {played
                    ? t('profile.gamesCount', { count: perf?.games ?? 0, defaultValue: '{{count}} rated games' })
                    : t('profile.provisional', 'Provisional · no rated games yet')}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>{t('profile.accountInfo', 'Account details')}</Typography>
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Grid container spacing={2}>
          {info.map((row, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ color: 'primary.main', display: 'grid', placeItems: 'center' }}>{row.icon}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {row.label}
                  </Typography>
                  <Box sx={{ fontWeight: 500, wordBreak: 'break-word' }}>{row.value}</Box>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};
