import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItemText,
  ListItemButton,
  CircularProgress,
} from '@mui/material';
import { notification } from 'antd';
import { fetchRequests, handleRequest } from '@/api/requests';
import { createNotification } from '@/api/notifications';

interface Request {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  experience?: string;
  goals?: string;
  createdAt: string;
  status: string;
}

export const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequestList = async () => {
    try {
      setIsLoading(true);
      const data = await fetchRequests();
      console.log('Полученные заявки:', data);
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
      notification.error({
        message: 'Ошибка',
        description: 'Не удалось загрузить заявки.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (action: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
  
    try {
      // Обновить статус заявки
      await handleRequest(selectedRequest._id, action);
  
      // Отправить уведомление студенту
      await createNotification({
        recipient: selectedRequest.student._id,
        type: 'system',
        content: `Ваша заявка была ${action === 'approved' ? 'принята' : 'отклонена'}`,
        metadata: {
          studentName: `${selectedRequest.student.firstName} ${selectedRequest.student.lastName}`,
          studentEmail: selectedRequest.student.email,
        },
      });
  
      notification.success({
        message: 'Успех',
        description: `Заявка успешно ${action === 'approved' ? 'принята' : 'отклонена'}.`,
      });
  
      await fetchRequestList();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Ошибка при обработке заявки:', error);
      notification.error({
        message: 'Ошибка',
        description: 'Не удалось обработать заявку.',
      });
    }
  };
  

  useEffect(() => {
    fetchRequestList();
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Заявки от студентов
      </Typography>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {/* Левая колонка: Список заявок */}
          <Grid item xs={4}>
            <Paper style={{ maxHeight: '80vh', overflow: 'auto' }}>
              <List>
                {requests.map((request) => (
                  <ListItemButton
                    key={request._id}
                    selected={selectedRequest?._id === request._id}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <ListItemText
                      primary={`${request.student.firstName} ${request.student.lastName}`}
                      secondary={new Date(request.createdAt).toLocaleString()}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Правая колонка: Детальная информация */}
          <Grid item xs={8}>
            <Paper style={{ padding: 16 }}>
              {selectedRequest ? (
                <>
                  <Typography variant="h6">
                    {selectedRequest.student.firstName} {selectedRequest.student.lastName}
                  </Typography>
                  <Typography>Email: {selectedRequest.student.email}</Typography>
                  <Typography>
                    Отправлено: {new Date(selectedRequest.createdAt).toLocaleString()}
                  </Typography>
                  <Typography>Опыт: {selectedRequest.experience || 'Не указано'}</Typography>
                  <Typography>Цели: {selectedRequest.goals || 'Не указано'}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleRequestAction('approved')}
                    style={{ marginRight: 8 }}
                    disabled={selectedRequest.status !== 'pending'}
                  >
                    Принять
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleRequestAction('rejected')}
                    disabled={selectedRequest.status !== 'pending'}
                  >
                    Отклонить
                  </Button>
                </>
              ) : (
                <Typography>Выберите заявку для просмотра деталей</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};
