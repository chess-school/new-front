import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Paper, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField 
} from '@mui/material';
import axios from 'axios';
import moment from 'moment';
import { notification } from 'antd';
import ScheduleCalendar from '@/shared/components/Calendar/SheduleCalendar';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { createNotification } from '@/api/notifications';

const eventColors: Record<ScheduleEvent['type'], string> = {
  individual_lesson: '#1976D2',
  group_lesson: '#388E3C',
  homework: '#F57C00',
  opening_study: '#8E24AA',
  tournament_participation: '#D32F2F',
};

const MAX_FILE_SIZE_MB = 5;

const StudentSchedulePage: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [homeworkText, setHomeworkText] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const studentId = JSON.parse(localStorage.getItem('user') || '{}')._id;
  const coachId = selectedEvent?.coach; // Получаем ID тренера из события

  const fetchSchedule = async () => {
    if (!studentId) return;

    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:3000/api/schedule/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data);
    } catch (error: any) {
      notification.error({ message: 'Помилка', description: 'Не вдалося отримати розклад.' });
      console.error('Помилка отримання розкладу:', error);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleSelectEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedEvent(null);
    setOpenDialog(false);
    setHomeworkText('');
    setScreenshot(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        notification.error({ message: 'Помилка', description: `Файл не може перевищувати ${MAX_FILE_SIZE_MB}MB` });
        return;
      }
      setScreenshot(file);
    }
  };

  const handleSendHomework = async () => {
    if (!homeworkText.trim() && !screenshot) {
      notification.error({ message: 'Помилка', description: 'Додайте текст або скріншот перед відправкою.' });
      return;
    }

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('scheduleId', selectedEvent?._id || '');
    if (homeworkText) formData.append('homeworkText', homeworkText);
    if (screenshot) formData.append('screenshot', screenshot);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/homework/send', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Отправка уведомления тренеру
      await sendMessageToCoach();

      notification.success({ message: 'Успіх', description: 'Домашнє завдання відправлено тренеру!' });
      handleCloseDialog();
    } catch (error: any) {
      console.error('Помилка відправки завдання:', error);
      notification.error({ message: 'Помилка', description: 'Не вдалося відправити завдання.' });
    }
  };

  // Отправка уведомления тренеру
  const sendMessageToCoach = async () => {
    if (!coachId) return;

    try {
      await createNotification({
        recipient: coachId,
        type: 'homework_submission',
        content: `Учень відправив домашнє завдання: ${homeworkText || 'Без тексту'}`,
        metadata: { scheduleId: selectedEvent?._id },
      });
      console.log('Повідомлення відправлено тренеру');
    } catch (error) {
      console.error('Помилка при відправці повідомлення:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Мій розклад занять
      </Typography>

      {/* Календарь */}
      <Paper style={{ padding: 20, marginTop: 20 }}>
        <ScheduleCalendar events={events} onSelectEvent={handleSelectEvent} />
      </Paper>

      {/* Текстовое представление занятий */}
      <Typography variant="h5" style={{ marginTop: 20 }}>
        Список занять
      </Typography>
      <Paper style={{ padding: 20, marginTop: 10 }}>
        {events.length === 0 ? (
          <Typography variant="body1">Заняття відсутні</Typography>
        ) : (
          events.map(event => (
            <Paper 
              key={event._id} 
              style={{ 
                padding: 10, 
                marginBottom: 10, 
                cursor: 'pointer', 
                backgroundColor: eventColors[event.type], 
                color: 'white' 
              }} 
              onClick={() => handleSelectEvent(event)}
            >
              <Typography variant="h6">{event.title}</Typography>
              <Typography variant="body2">Дата: {moment(event.date).format('DD/MM/YYYY HH:mm')}</Typography>
              {event.description && <Typography variant="body2">Опис: {event.description}</Typography>}
              {event.link && <Typography variant="body2">Посилання: <a href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</a></Typography>}
              <Typography variant="body2">Статус: {event.status}</Typography>
            </Paper>
          ))
        )}
      </Paper>

      {/* Модальное окно */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Деталі заняття</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <>
              <Typography variant="h6" style={{ color: eventColors[selectedEvent.type] }}>
                {selectedEvent.title}
              </Typography>
              <Typography variant="body2">Дата: {moment(selectedEvent.date).format('DD/MM/YYYY HH:mm')}</Typography>
              {selectedEvent.description && <Typography variant="body2">Опис: {selectedEvent.description}</Typography>}
              {selectedEvent.link && <Typography variant="body2">Посилання: <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer">{selectedEvent.link}</a></Typography>}
              <Typography variant="body2">Статус: {selectedEvent.status}</Typography>

              {selectedEvent.type === 'homework' && (
                <>
                  <Typography variant="h6" style={{ marginTop: 10 }}>Відправити домашнє завдання</Typography>
                  <TextField
                    label="Текст завдання"
                    fullWidth
                    multiline
                    rows={3}
                    value={homeworkText}
                    onChange={(e) => setHomeworkText(e.target.value)}
                    margin="normal"
                  />
                  <input type="file" accept="image/*" onChange={handleFileUpload} />
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Закрити</Button>
          {selectedEvent?.type === 'homework' && (
            <Button onClick={handleSendHomework} variant="contained" color="primary">
              Відправити
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentSchedulePage;
