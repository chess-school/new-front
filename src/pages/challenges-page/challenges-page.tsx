import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000'); // Подключение к серверу WebSocket

interface Challenge {
  id: string;
  creator: { firstName: string; lastName: string }; // Объект с данными создателя
  timeControl: string; // Например, "10+5" (10 минут + 5 секунд добавления)
  format: string; // Например, bullet, blitz, rapid, classic
}

const ChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeControl, setTimeControl] = useState('10+5');
  const [format, setFormat] = useState('blitz');
  const [loading, setLoading] = useState(true); // Для отображения загрузки
  const navigate = useNavigate();

  // Получение списка активных вызовов
  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/games', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChallenges(response.data);
    } catch (error) {
      console.error('Ошибка при получении списка вызовов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();

    // Подписка на обновления через WebSocket
    socket.on('gameListUpdated', (updatedChallenges: Challenge[]) => {
      setChallenges(updatedChallenges);
    });

    // Обработка ошибок WebSocket
    socket.on('connect_error', (err) => {
      console.error('WebSocket ошибка подключения:', err);
    });

    return () => {
      socket.off('gameListUpdated');
      socket.off('connect_error');
    };
  }, []);

  // Создание новой игры (вызова)
  const handleCreateChallenge = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        'http://localhost:3000/api/games',
        { timeControl, format },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newChallenge = response.data;
      socket.emit('createChallenge', newChallenge); // Сообщение через WebSocket
      setIsDialogOpen(false); // Закрыть диалог
    } catch (error) {
      console.error('Ошибка при создании вызова:', error);
    }
  };

  // Присоединение к вызову
  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3000/api/games/${challengeId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { gameId } = response.data;
      socket.emit('joinGame', { gameId });
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Ошибка при присоединении к вызову:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Список вызовов
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsDialogOpen(true)}
        style={{ marginBottom: '20px' }}
      >
        Создать вызов
      </Button>
      {loading ? (
        <Typography>Загрузка...</Typography>
      ) : challenges.length === 0 ? (
        <Typography>Пока что нет активных вызовов</Typography>
      ) : (
        <List>
          {challenges.map((challenge) => (
            <ListItem
              key={challenge.id}
              onClick={() => handleJoinChallenge(challenge.id)}
              component="li"
              style={{ cursor: 'pointer', borderBottom: '1px solid #ccc' }}
            >
              <ListItemText
                primary={`Игра: ${challenge.creator.firstName} ${challenge.creator.lastName}`}
                secondary={`Контроль времени: ${challenge.timeControl}, Формат: ${challenge.format}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Диалог для создания вызова */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Создать вызов</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Контроль времени (например, 10+5)"
            value={timeControl}
            onChange={(e) => setTimeControl(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Формат (bullet, blitz, rapid, classic)"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} color="secondary">
            Отмена
          </Button>
          <Button onClick={handleCreateChallenge} color="primary">
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChallengesPage;
