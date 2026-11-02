import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUrl, getPublicProfileByUuid } from '@/api/profile';
import { useParams, Navigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CircularProgress, Box, Typography, Grid, Paper, Tabs, Tab } from '@mui/material';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { ProfileHeader } from '@/components/Profile/ProfileHeader';
import { ProfileStats } from '@/components/Profile/ProfileStats';
import { ProfileClubs } from '@/components/Profile/ProfileClubs';
import { AccountSettings } from '@/components/Profile/AccountSettings';
import { User } from '@/types/User';

export const TestProfileV2Page: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { user: loggedInUser, loading, isAuthenticated, refetchUser } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'overview' | 'clubs' | 'account'>('overview');

  // Чужой профиль: подгружаем по uuid (сейчас резолвятся тренеры через /coaches).
  const isMyProfile = !!loggedInUser && loggedInUser.uuid === uuid;
  const [otherUser, setOtherUser] = useState<User | null | undefined>(undefined); // undefined=загрузка, null=не найден
  useEffect(() => {
    if (loading || isMyProfile || !uuid) return;
    let cancelled = false;
    setOtherUser(undefined);
    getPublicProfileByUuid(uuid)
      .then((u) => { if (!cancelled) setOtherUser(u ?? null); })
      .catch(() => { if (!cancelled) setOtherUser(null); });
    return () => { cancelled = true; };
  }, [uuid, isMyProfile, loading]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }
  if (!isAuthenticated || !loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  // ── Чужой профиль ──
  if (!isMyProfile) {
    if (otherUser === undefined) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }
    if (otherUser === null) {
      return (
        <PageContainer maxWidth={720}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" component="h1">{t('profile.otherTitle', "Viewing another user's profile")}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>{t('profile.otherNotFound', 'This profile is not available.')}</Typography>
          </Paper>
        </PageContainer>
      );
    }
    return (
      <PageContainer maxWidth={1100}>
        <ProfileHeader user={otherUser} avatarUrl={getAvatarUrl(otherUser.uuid)} isMyProfile={false} onEdit={() => {}} />
        <ProfileStats user={otherUser} />
      </PageContainer>
    );
  }

  // ── Свой профиль ──
  const avatarUrl = getAvatarUrl(loggedInUser.uuid);
  const quickLinks = [
    { to: '/books', icon: <MenuBookRoundedIcon />, label: t('nav.books', 'Books & courses') },
    { to: '/puzzles', icon: <ExtensionRoundedIcon />, label: t('nav.puzzles', 'Puzzles') },
    { to: '/analysis', icon: <QueryStatsRoundedIcon />, label: t('nav.analysis', 'Analysis') },
    { to: '/students-shedule', icon: <EventNoteRoundedIcon />, label: t('nav.schedule', 'Schedule & homework') },
  ];

  return (
    <PageContainer maxWidth={1100}>
      <ProfileHeader user={loggedInUser} avatarUrl={avatarUrl} isMyProfile onEdit={() => setTab('account')} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab value="overview" label={t('profile.tabOverview', 'Overview')} />
        <Tab value="clubs" label={t('profile.tabClubs', 'Clubs')} />
        <Tab value="account" label={t('profile.tabAccount', 'Account')} />
      </Tabs>

      {tab === 'clubs' && <ProfileClubs />}

      {tab === 'overview' && (
        <>
          <ProfileStats user={loggedInUser} />
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>{t('profile.quickLinks', 'Continue training')}</Typography>
          <Grid container spacing={2}>
            {quickLinks.map((link) => (
              <Grid item xs={12} sm={6} md={3} key={link.to}>
                <Paper component={RouterLink} to={link.to} sx={{
                  p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', textDecoration: 'none', color: 'text.primary',
                  transition: 'border-color .2s ease, transform .2s ease',
                  '&:hover': { borderColor: 'rgba(var(--accent-rgb),0.35)', transform: 'translateY(-2px)' },
                }}>
                  <Box sx={{ width: 42, height: 42, flexShrink: 0, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'rgba(var(--accent-rgb),0.12)', color: 'primary.main' }}>
                    {link.icon}
                  </Box>
                  <Typography fontWeight={600}>{link.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tab === 'account' && <AccountSettings user={loggedInUser} refetchUser={refetchUser} />}
    </PageContainer>
  );
};
