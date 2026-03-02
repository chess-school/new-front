import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUrl } from '@/api/profile';
import { useParams, Navigate } from 'react-router-dom';

import { ProfileHeader } from '@/components/Profile/ProfileHeader'; // Укажите правильный путь
import { EditProfileForm } from '@/components/Profile/EditProfileForm'; // Укажите правильный путь

import { Container, CircularProgress, Box, Typography } from '@mui/material';

export const TestProfileV2Page: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const { user: loggedInUser, loading, isAuthenticated, logout, refetchUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

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
          <Container>
              <h1>Viewing another user's profile</h1>
              <p>User UUID from URL: {uuid}</p>
              <p>This functionality is not yet implemented.</p>
          </Container>
      );
  }
  
  const userToDisplay = loggedInUser;
  const avatarUrl = getAvatarUrl(userToDisplay.uuid);
  const handleLogout = () => logout();

  return (
    <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 5 }}>
        <Container maxWidth="lg">
          <ProfileHeader 
            user={userToDisplay}
            avatarUrl={avatarUrl}
            isMyProfile={isMyProfile}
            onEdit={() => setIsEditing(true)}
            onLogout={handleLogout}
          />
          
          <Box sx={{ textAlign: 'center', mt: 4, p: 2, bgcolor: '#1c1c1c', borderRadius: 2 }}>
            <Typography variant="h6">My Dashboard</Typography>
            <Typography sx={{ color: 'grey.500', mt: 1 }}>
              Upcoming lessons and statistics widgets will be displayed here.
            </Typography>
          </Box>
          
          {isEditing && (
              <EditProfileForm
                  user={userToDisplay}
                  onClose={() => setIsEditing(false)}
                  refetchUser={refetchUser}
              />
          )}

      </Container>
    </Box>
  );
};