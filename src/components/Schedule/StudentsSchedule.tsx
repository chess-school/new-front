// StudentSchedule.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Paper, CircularProgress } from '@mui/material';
import './styles.scss'; 

const localizer = momentLocalizer(moment);

interface ScheduleEvent extends Event {
  _id: string;
  title: string;
  date: string;
  type: string;
}

const StudentSchedule: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const studentId = JSON.parse(localStorage.getItem('user') || '{}')._id;

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`http://localhost:3000/api/schedule/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching student schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [studentId]);

  return (
    <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h2" component="h1" fontWeight="bold">
            {t('schedule.myScheduleTitle')}
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
            {t('schedule.myScheduleSubtitle')}
          </Typography>
        </Box>
        <Paper sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#1c1c1c', borderRadius: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: '#FFD700' }} />
            </Box>
          ) : (
            <Calendar
              localizer={localizer}
              events={events.map(event => ({
                ...event,
                start: new Date(event.date),
                end: moment(event.date).add(1, 'hour').toDate(), // Assuming 1 hour duration
                title: `${t(`schedule.type_${event.type.split('_')[0]}`)}: ${event.title}`
              }))}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              views={['month', 'week', 'day', 'agenda']}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default StudentSchedule;