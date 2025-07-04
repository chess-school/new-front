import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Paper, Grid, CircularProgress, Box, Stack, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EditProfileForm from '../../components/Profile/EditProfileForm';
import { getProfile, getPlayerStats, getAvatarUrl } from '../../api/profile';
import { User } from '@/types/User';

// Icons
import WhatshotIcon from '@mui/icons-material/Whatshot'; // Bullet
import BoltIcon from '@mui/icons-material/Bolt'; // Blitz
import TimerIcon from '@mui/icons-material/Timer'; // Rapid
import StyleIcon from '@mui/icons-material/Style'; // Classic
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

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

const statIcons: { [key: string]: React.ReactElement } = {
  bullet: <WhatshotIcon />,
  blitz: <BoltIcon />,
  rapid: <TimerIcon />,
  classic: <StyleIcon />,
};

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
        setPlayerStats({ bullet: stats.bullet, blitz: stats.blitz, rapid: stats.rapid, classic: stats.classic });
      } catch (err) {
        setError(t('profile.errorLoadingProfile'));
        // Optional: Redirect after a delay to show the error message
        // setTimeout(() => navigate('/login'), 3000);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: '#0e0e0e' }}>
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: '#0e0e0e' }}>
          <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        {user && (
          <>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Typography variant="h2" component="h1" fontWeight="bold">{t('profile.title')}</Typography>
                <Typography variant="h6" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>{t('profile.subtitle')}</Typography>
            </Box>

            <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: '#1c1c1c', borderRadius: 4, color: 'white' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
                <Avatar src={getAvatarUrl(user._id)} sx={{ width: 120, height: 120, border: '4px solid #FFD700' }} />
                <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
                  <Typography variant="h4" fontWeight="bold">{user.firstName} {user.lastName}</Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'capitalize', mb: 1 }}>{user.roles[0] || 'User'}</Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{user.email}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {t('profile.registrationDate')}: {new Date(user.registrationDate).toLocaleDateString()}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} sx={{ mt: { xs: 3, md: 0 } }}>
                  <Button variant="outlined" onClick={() => setIsEditing(true)} startIcon={<EditIcon />} sx={{ color: '#FFD700', borderColor: '#FFD700' }}>
                    {t('profile.editProfile')}
                  </Button>
                  <Button variant="contained" color="error" onClick={handleLogout} startIcon={<LogoutIcon />}>
                    {t('profile.logout')}
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {playerStats && (
              <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: '#1c1c1c', borderRadius: 4, color: 'white' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>{t('profile.playerStats')}</Typography>
                <Grid container spacing={3}>
                  {Object.entries(playerStats).map(([key, stats]) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                      <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', bgcolor: '#2a2a2a', height: '100%' }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ color: '#FFD700' }}>
                          {statIcons[key]}
                          <Typography variant="h6" fontWeight="bold" textTransform="capitalize">{t(`profile.${key}`)}</Typography>
                        </Stack>
                        <Typography variant="h3" fontWeight="bold" my={1}>{stats.rating}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                          {stats.gamesPlayed} {t('profile.games')}
                        </Typography>
                        <Stack direction="row" justifyContent="space-around" spacing={1}>
                          <Box>
                            <Typography color="success.main" fontWeight="bold">{stats.gamesWon}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{t('profile.win')}</Typography>
                          </Box>
                           <Box>
                            <Typography fontWeight="bold">{stats.gamesDrawn}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{t('profile.draw')}</Typography>
                          </Box>
                           <Box>
                            <Typography color="error.main" fontWeight="bold">{stats.gamesLost}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{t('profile.loss')}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {isEditing && (
              <EditProfileForm user={user} onClose={() => setIsEditing(false)} />
            )}
          </>
        )}
      </Container>
    </Box>
  );
};