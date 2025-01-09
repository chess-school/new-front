import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Paper, Grid } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EditProfileForm from '../../components/Profile/EditProfileForm';
import { useTranslation } from 'react-i18next';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  registrationDate: string;
}

interface PlayerStats {
  bullet: {
    rating: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesDrawn: number;
    gamesLost: number;
  };
  blitz: {
    rating: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesDrawn: number;
    gamesLost: number;
  };
  rapid: {
    rating: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesDrawn: number;
    gamesLost: number;
  };
  classic: {
    rating: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesDrawn: number;
    gamesLost: number;
  };
}

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:3000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);

      const playerResponse = await axios.get(
        `http://localhost:3000/api/player/${response.data._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlayerStats(playerResponse.data);

      setIsLoading(false);
    } catch (error) {
      console.error(t('profile.errorLoadingProfile'), error);
      setError(t('profile.errorLoadingProfile'));
      setIsLoading(false);
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (isLoading) {
    return <Typography>{t('profile.loading')}</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {t('profile.profileTitle')}
      </Typography>
      {user ? (
        <>
          <Paper style={{ padding: 20, marginBottom: 20 }}>
            <Typography variant="h6">
              {t('profile.welcome', { firstName: user.firstName, lastName: user.lastName })}
            </Typography>
            <Typography>{t('profile.email')}: {user.email}</Typography>
            <Typography>
              {t('profile.registrationDate')}: {new Date(user.registrationDate).toLocaleDateString()}
            </Typography>
            <Typography>{t('profile.roles')}: {user.roles.join(', ')}</Typography>
          </Paper>

          {playerStats && (
            <Paper style={{ padding: 20, marginBottom: 20 }}>
              <Typography variant="h6">{t('profile.playerStats')}</Typography>
              <Grid container spacing={2}>
                {['bullet', 'blitz', 'rapid', 'classic'].map((format) => (
                  <Grid item xs={12} sm={6} md={3} key={format}>
                    <Typography variant="subtitle1">
                      {t(`profile.${format}`)}
                    </Typography>
                    <Typography>{t('profile.rating')}: {playerStats[format as keyof PlayerStats].rating}</Typography>
                    <Typography>{t('profile.gamesPlayed')}: {playerStats[format as keyof PlayerStats].gamesPlayed}</Typography>
                    <Typography>{t('profile.gamesWon')}: {playerStats[format as keyof PlayerStats].gamesWon}</Typography>
                    <Typography>{t('profile.gamesDrawn')}: {playerStats[format as keyof PlayerStats].gamesDrawn}</Typography>
                    <Typography>{t('profile.gamesLost')}: {playerStats[format as keyof PlayerStats].gamesLost}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          <Button variant="contained" onClick={() => setIsEditing(true)}>
            {t('profile.editProfile')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            style={{ marginLeft: '10px' }}
          >
            {t('profile.logout')}
          </Button>
          {isEditing && <EditProfileForm user={user} onClose={() => setIsEditing(false)} />}
        </>
      ) : (
        <Typography>{t('profile.playerNotFound')}</Typography>
      )}
    </Container>
  );
};
