import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Container, Typography, Paper, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, CircularProgress, Box
} from '@mui/material';
import moment from 'moment';
import { notification } from 'antd';

import { getScheduleByStudent, sendHomework } from '@/api/schedule';
import { createNotification } from '@/api/notifications';

import ScheduleCalendar from '@/shared/components/Calendar/SheduleCalendar';
import { ScheduleEvent } from '@/types/SheduleEvent';

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
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [homeworkText, setHomeworkText] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const studentId = useMemo(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr)._id : null;
  }, []);

  const fetchSchedule = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const scheduleData = await getScheduleByStudent(studentId);
      setEvents(scheduleData);
    } catch (error) {
      console.error('Ошибка получения расписания:', error);
      notification.error({ message: 'Ошибка', description: 'Не удалось получить расписание.' });
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

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
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        notification.error({ message: 'Ошибка', description: `Файл не может превышать ${MAX_FILE_SIZE_MB}MB` });
        return;
      }
      setScreenshot(file);
    }
  };

  const handleSendHomework = async () => {
    if (!homeworkText.trim() && !screenshot) {
      notification.error({ message: 'Ошибка', description: 'Добавьте текст или скриншот перед отправкой.' });
      return;
    }
    if (!studentId || !selectedEvent) return;

    try {
      // 3. Вызываем сервис для отправки ДЗ
      await sendHomework({
        studentId,
        scheduleId: selectedEvent._id,
        homeworkText: homeworkText.trim() ? homeworkText : undefined,
        screenshot: screenshot || undefined,
      });

      // 4. После успешной отправки ДЗ, отправляем уведомление
      if (selectedEvent.coach) {
        await createNotification({
          recipient: selectedEvent.coach,
          type: 'homework_submission',
          content: `Ученик отправил домашнее задание по теме: "${selectedEvent.title}"`,
          metadata: { scheduleId: selectedEvent._id },
        });
      }

      notification.success({ message: 'Успех', description: 'Домашнее задание отправлено тренеру!' });
      handleCloseDialog();
    } catch (error) {
      console.error('Ошибка отправки задания:', error);
    }
  };
  
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Мой расклад занятий
      </Typography>

      <Paper style={{ padding: 20, marginTop: 20 }}>
        {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
        ) : (
          <ScheduleCalendar events={events} onSelectEvent={handleSelectEvent} />
        )}
      </Paper>

      <Typography variant="h5" style={{ marginTop: 20 }}>
        Список занятий
      </Typography>
      <Paper style={{ padding: 20, marginTop: 10 }}>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>}
        {!loading && events.length === 0 && (
          <Typography variant="body1">Занятия отсутствуют</Typography>
        )}
        {!loading && events.map(event => (
            <Paper 
              key={event._id} 
              style={{ padding: 10, marginBottom: 10, cursor: 'pointer', backgroundColor: eventColors[event.type], color: 'white' }} 
              onClick={() => handleSelectEvent(event)}
            >
              <Typography variant="h6">{event.title}</Typography>
              <Typography variant="body2">Дата: {moment(event.date).format('DD/MM/YYYY HH:mm')}</Typography>
              {event.description && <Typography variant="body2">Описание: {event.description}</Typography>}
              {event.link && <Typography variant="body2">Ссылка: <a href={event.link} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>{event.link}</a></Typography>}
              <Typography variant="body2">Статус: {event.status}</Typography>
            </Paper>
          ))
        }
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Детали занятия</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <>
              <Typography variant="h6" style={{ color: eventColors[selectedEvent.type] }}>
                {selectedEvent.title}
              </Typography>
              <Typography variant="body2">Дата: {moment(selectedEvent.date).format('DD/MM/YYYY HH:mm')}</Typography>
              {selectedEvent.description && <Typography variant="body2">Описание: {selectedEvent.description}</Typography>}
              {selectedEvent.link && <Typography variant="body2">Ссылка: <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer">{selectedEvent.link}</a></Typography>}
              <Typography variant="body2">Статус: {selectedEvent.status}</Typography>

              {selectedEvent.type === 'homework' && (
                <Box mt={2}>
                  <Typography variant="h6" style={{ marginTop: 10 }}>Отправить домашнее задание</Typography>
                  <TextField
                    label="Текст задания"
                    fullWidth
                    multiline
                    rows={3}
                    value={homeworkText}
                    onChange={(e) => setHomeworkText(e.target.value)}
                    margin="normal"
                  />
                  <Button variant="contained" component="label">
                    Загрузить скриншот
                    <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                  </Button>
                  {screenshot && <Typography variant="caption" display="block" mt={1}>{screenshot.name}</Typography>}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Закрыть</Button>
          {selectedEvent?.type === 'homework' && (
            <Button onClick={handleSendHomework} variant="contained" color="primary">
              Отправить
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentSchedulePage;