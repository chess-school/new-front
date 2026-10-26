import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUrl } from '@/api/profile';
import { useParams, Navigate } from 'react-router-dom';

import { ProfileHeader } from '@/components/Profile/ProfileHeader'; // Укажите правильный путь
import { ProfileStats } from '@/components/Profile/ProfileStats';
import { EditProfileForm } from '@/components/Profile/EditProfileForm'; // Укажите правильный путь

import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CircularProgress, Box, Typography, Grid, Paper } from '@mui/material';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import { PageContainer } from '@/shared/components/ui/PageHeader';

export const TestProfileV2Page: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { user: loggedInUser, loading, isAuthenticated, logout, refetchUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslation();

  // Во время первоначальной загрузки показываем индикатор
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }
  
  // Если загрузка завершена, но пользователя нет, перенаправляем на логин
  if (!isAuthenticated || !loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  const isMyProfile = loggedInUser.uuid === uuid;
  
  // Пока мы не умеем грузить чужие профили, показываем только свой
  if (!isMyProfile) {
      return (
          <PageContainer maxWidth={720}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h5">{t('profile.otherTitle', "Viewing another user's profile")}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>{t('profile.otherNotImplemented', 'This functionality is not yet implemented.')}</Typography>
              </Paper>
          </PageContainer>
      );
  }
  
  const userToDisplay = loggedInUser;
  const avatarUrl = getAvatarUrl(userToDisplay.uuid);
  const handleLogout = () => logout();
  const quickLinks = [
    { to: '/books', icon: <MenuBookRoundedIcon />, label: t('nav.books', 'Books & courses') },
    { to: '/puzzles', icon: <ExtensionRoundedIcon />, label: t('nav.puzzles', 'Puzzles') },
    { to: '/analysis', icon: <QueryStatsRoundedIcon />, label: t('nav.analysis', 'Analysis') },
    { to: '/students-shedule', icon: <EventNoteRoundedIcon />, label: t('nav.schedule', 'Schedule & homework') },
  ];

  return (
    <PageContainer maxWidth={1100}>
          <ProfileHeader 
            user={userToDisplay}
            avatarUrl={avatarUrl}
            isMyProfile={isMyProfile}
            onEdit={() => setIsEditing(true)}
            onLogout={handleLogout}
          />

          <ProfileStats user={userToDisplay} />

          <Typography variant="h6" sx={{ mb: 2 }}>{t('profile.quickLinks', 'Continue training')}</Typography>
          <Grid container spacing={2}>
            {quickLinks.map((link) => (
              <Grid item xs={12} sm={6} md={3} key={link.to}>
                <Paper component={RouterLink} to={link.to} sx={{
                  p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', textDecoration: 'none', color: 'text.primary',
                  transition: 'border-color .2s ease, transform .2s ease',
                  '&:hover': { borderColor: 'rgba(138,43,43,0.35)', transform: 'translateY(-2px)' },
                }}>
                  <Box sx={{ width: 42, height: 42, flexShrink: 0, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'rgba(138,43,43,0.12)', color: 'primary.main' }}>
                    {link.icon}
                  </Box>
                  <Typography fontWeight={600}>{link.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          {isEditing && (
              <EditProfileForm
                  user={userToDisplay}
                  onClose={() => setIsEditing(false)}
                  refetchUser={refetchUser}
              />
          )}

    </PageContainer>
  );
};