import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Paper, Grid } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EditProfileForm from '../../components/Profile/EditProfileForm';

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

      // Проверяем наличие игрока (Player)
      const playerResponse = await axios.get(
        `http://localhost:3000/api/player/${response.data._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlayerStats(playerResponse.data);

      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при получении профиля:', error);
      setError('Ошибка при загрузке профиля');
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
    return <Typography>Загрузка...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Личный кабинет
      </Typography>
      {user ? (
        <>
          <Paper style={{ padding: 20, marginBottom: 20 }}>
            <Typography variant="h6">
              Добро пожаловать, {user.firstName} {user.lastName}
            </Typography>
            <Typography>Email: {user.email}</Typography>
            <Typography>
              Дата регистрации: {new Date(user.registrationDate).toLocaleDateString()}
            </Typography>
            <Typography>Роли: {user.roles.join(', ')}</Typography>
          </Paper>

          {playerStats && (
            <Paper style={{ padding: 20, marginBottom: 20 }}>
              <Typography variant="h6">Статистика игрока</Typography>
              <Grid container spacing={2}>
                {['bullet', 'blitz', 'rapid', 'classic'].map((format) => (
                  <Grid item xs={12} sm={6} md={3} key={format}>
                    <Typography variant="subtitle1">
                      {format[0].toUpperCase() + format.slice(1)}
                    </Typography>
                    <Typography>Рейтинг: {playerStats[format as keyof PlayerStats].rating}</Typography>
                    <Typography>
                      Игры сыграно: {playerStats[format as keyof PlayerStats].gamesPlayed}
                    </Typography>
                    <Typography>Победы: {playerStats[format as keyof PlayerStats].gamesWon}</Typography>
                    <Typography>Ничьи: {playerStats[format as keyof PlayerStats].gamesDrawn}</Typography>
                    <Typography>Поражения: {playerStats[format as keyof PlayerStats].gamesLost}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          <Button variant="contained" onClick={() => setIsEditing(true)}>
            Редактировать профиль
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLogout}
            style={{ marginLeft: '10px' }}
          >
            Выйти
          </Button>
          {isEditing && <EditProfileForm user={user} onClose={() => setIsEditing(false)} />}
        </>
      ) : (
        <Typography>Пользователь не найден</Typography>
      )}
    </Container>
  );
};
