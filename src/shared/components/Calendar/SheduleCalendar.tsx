// src/shared/components/Calendar/ScheduleCalendar.tsx
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ScheduleEvent } from '@/types/SheduleEvent';

const localizer = momentLocalizer(moment);

interface ScheduleCalendarProps {
  events: ScheduleEvent[];
  onSelectEvent: (event: ScheduleEvent) => void;
}

const eventColors: Record<ScheduleEvent['type'], string> = {
  individual_lesson: '#1976D2',
  group_lesson: '#388E3C',
  homework: '#F57C00',
  opening_study: '#8E24AA',
  tournament_participation: '#D32F2F',
};

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ events, onSelectEvent }) => {
  return (
    <Calendar
      localizer={localizer}
      events={events.map(event => ({
        ...event,
        start: new Date(event.date),
        end: new Date(event.date),
        title: event.title,
        color: eventColors[event.type] || '#000'
      }))}
      startAccessor="start"
      endAccessor="end"
      views={['month', 'week', 'day']}
      popup
      onSelectEvent={onSelectEvent}
      style={{ height: 500 }}
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: eventColors[event.type] || '#000',
          color: 'white'
        }
      })}
    />
  );
};

export default ScheduleCalendar;
