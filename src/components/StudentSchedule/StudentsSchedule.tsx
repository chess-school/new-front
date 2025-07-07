import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Box, Paper, CircularProgress, Tooltip, Typography } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getScheduleByStudent } from '@/api/schedule';
import { ScheduleEvent } from '@/types/SheduleEvent';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.scss';

const localizer = momentLocalizer(moment);

const eventTypeIcons = {
  individual_lesson: <EventNoteIcon fontSize="small" />,
  group_lesson: <PeopleIcon fontSize="small" />,
  homework: <AssignmentIcon fontSize="small" />,
  opening_study: <MenuBookIcon fontSize="small" />,
  tournament_participation: <EmojiEventsIcon fontSize="small" />,
};

interface CalendarDisplayEvent {
  _id: string;
  type: keyof typeof eventTypeIcons;
  title?: string;
  start?: Date;
  end?: Date;
  description?: string;
}

const CustomEvent: React.FC<{ event: CalendarDisplayEvent }> = ({ event }) => {
  const icon = eventTypeIcons[event.type];
  const className = `custom-event rbc-event--${event.type}`;
  return (
    <Tooltip title={event.description || event.title} placement="top">
      <div className={className}>
        {icon}
        <Typography variant="caption" noWrap component="span">{event.title}</Typography>
      </div>
    </Tooltip>
  );
};

const StudentSchedule: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = useMemo(() => {
    const userStr = localStorage.getItem('user');
    try {
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        return JSON.parse(userStr)._id;
      }
    } catch (error) { console.error("Failed to parse user from localStorage:", error); }
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
      _id: event._id,
      start: new Date(event.date),
      end: moment(event.date).add(1, 'hour').toDate(),
      title: event.title,
      type: event.type as keyof typeof eventTypeIcons,
      description: event.description,
    }));
  }, [events]);

  return (
    <Paper className="schedule-paper">
      {loading ? (
        <Box className="loader-container">
          <CircularProgress className="loader" />
        </Box>
      ) : (
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          views={['month', 'week', 'day', 'agenda']}
          components={{ event: CustomEvent as any }}
          className="schedule-calendar-standalone"
        />
      )}
    </Paper>
  );
};

export default StudentSchedule;