import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EditProfileForm from '../../components/Profile/EditProfileForm';
import { getProfile, getPlayerStats, getAvatarUrl } from '../../api/profile';
import { User } from '@/types/User';

interface PlayerStatsFormat {
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesDrawn: number;
  gamesLost: number;
}

interface PlayerStats {
  bullet: PlayerStatsFormat;
  blitz: PlayerStatsFormat;
  rapid: PlayerStatsFormat;
  classic: PlayerStatsFormat;
}

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getProfile();
        const stats = await getPlayerStats(profile._id);

        setUser(stats.user);
        setPlayerStats({
          bullet: stats.bullet,
          blitz: stats.blitz,
          rapid: stats.rapid,
          classic: stats.classic,
        });
      } catch (err) {
        console.error(t('profile.errorLoadingProfile'), err);
        setError(t('profile.errorLoadingProfile'));
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <Container sx={{ textAlign: 'center', py: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container maxWidth="md">
      {user && (
        <>
          {/* Верхняя карточка профиля */}
          <Paper
            sx={{
              p: 4,
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img
                src={getAvatarUrl(user._id)}
                alt="avatar"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              <div>
                <Typography variant="h5" fontWeight="bold">
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography color="textSecondary">
                  {user.roles[0] || 'User'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {user.email}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {t('profile.registrationDate')}:{' '}
                  {new Date(user.registrationDate).toLocaleDateString()}
                </Typography>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                variant="outlined"
                onClick={() => setIsEditing(true)}
              >
                {t('profile.editProfile')}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleLogout}
              >
                {t('profile.logout')}
              </Button>
            </div>
          </Paper>

          {/* Статистика */}
          {playerStats && (
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" mb={2}>
                {t('profile.playerStats')}
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(playerStats).map(([key, stats]) => (
                  <Grid item xs={12} sm={6} md={3} key={key}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        textAlign: 'center',
                        backgroundColor: '#f5f7fa',
                        boxShadow: 2,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {t(`profile.${key}`)}
                      </Typography>
                      <Typography fontSize={24} fontWeight="bold" gutterBottom>
                        {stats.rating}
                      </Typography>
                      <Typography variant="body2">{t('profile.gamesPlayed')}: {stats.gamesPlayed}</Typography>
                      <Typography variant="body2">{t('profile.gamesWon')}: {stats.gamesWon}</Typography>
                      <Typography variant="body2">{t('profile.gamesDrawn')}: {stats.gamesDrawn}</Typography>
                      <Typography variant="body2">{t('profile.gamesLost')}: {stats.gamesLost}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Форма редактирования */}
          {isEditing && (
            <EditProfileForm user={user} onClose={() => setIsEditing(false)} />
          )}
        </>
      )}
    </Container>
  );
};
