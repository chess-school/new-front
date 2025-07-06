import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Paper, CircularProgress } from '@mui/material';

import { getScheduleByStudent } from '@/api/schedule';
import { ScheduleEvent } from '@/types/SheduleEvent';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.scss'; 

const localizer = momentLocalizer(moment);

interface CalendarDisplayEvent extends BigCalendarEvent {
  _id: string;
  type: string;
}

const StudentSchedule: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = useMemo(() => {
    const userStr = localStorage.getItem('user');
    try {
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        return JSON.parse(userStr)._id;
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
    }
    return null;
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const scheduleData = await getScheduleByStudent(studentId);
        setEvents(scheduleData);
      } catch (error) {
        console.error('Error fetching student schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [studentId]); 
  const calendarEvents: CalendarDisplayEvent[] = useMemo(() => {
    return events.map(event => ({
      ...event,
      start: new Date(event.date),
      end: moment(event.date).add(1, 'hour').toDate(),
      title: `${t(`schedule.eventTypes.${event.type}`)}: ${event.title}`
    }));
  }, [events, t]);

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
              events={calendarEvents}
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