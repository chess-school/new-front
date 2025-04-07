import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { notification } from 'antd';

const localizer = momentLocalizer(moment);

interface ScheduleEvent {
    _id?: string;
    student: string;
    coach: string;
    title: string;
    description?: string;
    link?: string;
    type: string;
    date: string;
    status: string;
}

interface EditScheduleModalProps {
    open: boolean;
    onClose: () => void;
    student: any;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ open, onClose, student }) => {
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
      student: student?._id || '',
      coach: '',
      title: '',
      description: '',
      link: '',
      type: '',
      date: '',
      status: 'scheduled'
  });

    const fetchSchedule = async () => {
        if (!student?._id) return;
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`http://localhost:3000/api/schedule/student/${student._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEvents(response.data);
        } catch (error: any) {
            console.error('Помилка отримання розкладу:', error);
        }
    };

    const handleAddEvent = async () => {
      console.log("Попытка создания занятия с данными:", newEvent);
  
      if (!newEvent.date || !student._id || !newEvent.type) {
          notification.error({ message: 'Помилка', description: 'Необхідно заповнити обов’язкові поля (дата, тип заняття).' });
          console.error("Ошибка: не все обязательные поля заполнены", newEvent);
          return;
      }
  
      const token = localStorage.getItem('token');
      try {
          const response = await axios.post(
              'http://localhost:3000/api/schedule/create',
              {
                  studentId: student._id,
                  date: new Date(newEvent.date).toISOString(),
                  title: newEvent.title?.trim() || "",  // Убираем обязательность
                  description: newEvent.description?.trim() || "",
                  link: newEvent.link?.trim() || "",
                  type: newEvent.type,
                  status: newEvent.status
              },
              {
                  headers: { Authorization: `Bearer ${token}` },
              }
          );
  
          console.log("Ответ от сервера при создании занятия:", response.data);
          notification.success({ message: 'Успіх', description: 'Заняття успішно додано!' });
          fetchSchedule();
      } catch (error: any) {
          console.error("Ошибка при создании занятия:", error.response?.data || error.message);
          notification.error({ 
              message: 'Помилка створення розкладу', 
              description: error.response?.data?.msg || 'Не вдалося створити заняття. Перевірте дані та спробуйте ще раз.' 
          });
      }
  };
  

    const handleDeleteEvent = async () => {
        if (!newEvent._id) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:3000/api/schedule/${newEvent._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            notification.success({ message: 'Успіх', description: 'Заняття видалено!' });
            fetchSchedule();
            setNewEvent({
                student: student?._id || '',
                coach: '',
                title: '',
                description: '',
                link: '',
                type: '',
                date: '',
                status: 'scheduled'
            });
        } catch (error: any) {
            console.error('Помилка видалення заняття:', error);
            notification.error({ message: 'Помилка', description: 'Не вдалося видалити заняття.' });
        }
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setNewEvent({
            student: student._id,
            coach: '',
            date: moment(start).toISOString(),
            title: '',
            description: '',
            link: '',
            type: '',
            status: 'scheduled'
        });
    };

    const handleSelectEvent = (event: ScheduleEvent) => {
        setNewEvent({
            _id: event._id,
            student: event.student,
            coach: event.coach,
            date: event.date,
            title: event.title,
            description: event.description || '',
            link: event.link || '',
            type: event.type,
            status: event.status
        });
    };

    useEffect(() => {
        if (open) fetchSchedule();
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Редагувати розклад для {student.firstName} {student.lastName}</DialogTitle>
            <DialogContent>
                <Calendar
                    localizer={localizer}
                    events={events.map(event => ({
                        ...event,
                        start: new Date(event.date),
                        end: new Date(event.date),
                        title: `${event.title} (${event.type})`
                    }))}
                    startAccessor="start"
                    endAccessor="end"
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    views={['month', 'week', 'day']}
                    style={{ height: 400 }}
                />

                {/* Название */}
                <TextField
                    label="Назва*"
                    fullWidth
                    margin="normal"
                    value={newEvent.title || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />

                {/* Тип занятия */}
                <FormControl fullWidth margin="normal">
                    <InputLabel>Тип заняття*</InputLabel>
                    <Select
                        value={newEvent.type || ''}
                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                        displayEmpty
                    >
                        <MenuItem value="individual_lesson">Індивідуальне заняття</MenuItem>
                        <MenuItem value="group_lesson">Групове заняття</MenuItem>
                        <MenuItem value="homework">Домашнє завдання</MenuItem>
                        <MenuItem value="opening_study">Робота над дебютом</MenuItem>
                        <MenuItem value="tournament_participation">Участь у турнірі</MenuItem>
                    </Select>
                </FormControl>

                {/* Описание */}
                <TextField
                    label="Опис"
                    fullWidth
                    margin="normal"
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />

                {/* Ссылка */}
                <TextField
                    label="Посилання"
                    fullWidth
                    margin="normal"
                    value={newEvent.link || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                />

                {/* Дата */}
                <TextField
                    label="Дата*"
                    type="datetime-local"
                    fullWidth
                    margin="normal"
                    value={newEvent.date || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Закрити</Button>
                <Button onClick={handleAddEvent} variant="contained">Додати заняття</Button>
                {newEvent._id && (
                    <Button onClick={handleDeleteEvent} variant="contained" color="secondary">
                        Видалити
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default EditScheduleModal;
