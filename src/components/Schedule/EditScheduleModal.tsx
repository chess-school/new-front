import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

const localizer = momentLocalizer(moment);

interface ScheduleEvent {
    _id?: string;
    student: string;
    coach: string;
    title: string;
    notes: string;
    date: string; 
  }
  
interface EditScheduleModalProps {
  open: boolean;
  onClose: () => void;
  student: any;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ open, onClose, student }) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    date: '',
    title: '',
    notes: ''
  });

  const fetchSchedule = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:3000/api/schedule/student/${student._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const handleAddEvent = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        'http://localhost:3000/api/schedule/create',
        {
          studentId: student._id,
          date: newEvent.date,
          title: newEvent.title,
          notes: newEvent.notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchSchedule();
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  useEffect(() => {
    if (open) fetchSchedule();
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Редактировать план для {student.firstName} {student.lastName}</DialogTitle>
      <DialogContent>
        <Calendar
          localizer={localizer}
          events={events.map(event => ({
            ...event,
            start: new Date(event.date),
            end: new Date(event.date)
          }))}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 400 }}
        />
        <TextField
          label="Название"
          fullWidth
          margin="normal"
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />
        <TextField
          label="Заметки"
          fullWidth
          margin="normal"
          onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
        />
        <TextField
          label="Дата"
          type="datetime-local"
          fullWidth
          margin="normal"
          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button onClick={handleAddEvent} variant="contained">Добавить занятие</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditScheduleModal;
