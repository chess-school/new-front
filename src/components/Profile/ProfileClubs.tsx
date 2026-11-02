import React, { useEffect, useState } from 'react';
import { Avatar, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMyClubs, MyClubEntry, ClubRole } from '@/features/clubs/clubsApi';

const ROLE_FALLBACK: Record<ClubRole, string> = { owner: 'Owner', trainer: 'Coach', student: 'Student', parent: 'Parent' };

/** Вкладка «Клубы»: членства пользователя из /clubs/mine с ролью и переходом на сайт клуба. */
export const ProfileClubs: React.FC = () => {
  const { t } = useTranslation();
  const [clubs, setClubs] = useState<MyClubEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyClubs()
      .then((list) => { if (!cancelled) setClubs(list); })
      .catch(() => { if (!cancelled) { setError(true); setClubs([]); } });
    return () => { cancelled = true; };
  }, []);

  if (clubs === null) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error || clubs.length === 0) {
    return (
      <Paper sx={{ p: 5, textAlign: 'center' }}>
        <GroupsRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">
          {error ? t('common.loadError', 'Failed to load. Please try again.') : t('profile.clubsEmpty', "You're not a member of any club yet.")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5}>
      {clubs.map(({ role, club }) => {
        const accent = club.brand?.primaryColor || 'var(--brand-primary)';
        return (
          <Paper key={club._id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={club.logoUrl || undefined} variant="rounded" sx={{ width: 48, height: 48, bgcolor: accent, color: '#fff', fontWeight: 700 }}>
              {club.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={600} noWrap>{club.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                <Chip label={t(`profile.clubRole.${role}`, ROLE_FALLBACK[role])} size="small" sx={{ bgcolor: 'surface.overlay', color: 'text.primary', fontWeight: 600 }} />
                {club.city && <Typography variant="body2" color="text.secondary" noWrap>{club.city}</Typography>}
              </Stack>
            </Box>
            <Button component={RouterLink} to={`/c/${club.slug}`} size="small" variant="outlined" endIcon={<OpenInNewRoundedIcon />} sx={{ flexShrink: 0 }}>
              {t('profile.openClub', 'Open')}
            </Button>
          </Paper>
        );
      })}
    </Stack>
  );
};
