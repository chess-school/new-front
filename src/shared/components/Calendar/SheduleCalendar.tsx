// src/shared/components/Calendar/ScheduleCalendar.tsx
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-dark.scss';
import { Lesson, LessonStatus } from '@/api/lessons';

const localizer = momentLocalizer(moment);
const DEFAULT_DURATION = 60;

const statusColors: Record<LessonStatus, string> = {
  scheduled: '#2f6fbf',
  completed: '#2ea043',
  cancelled: '#484f58',
  missed: '#da3633',
};

interface ScheduleCalendarProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
}

type CalendarItem = { lesson: Lesson; title: string; start: Date; end: Date };

/** Календарь занятий (API v2): цвет — по статусу занятия, длина — по длительности */
const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ lessons, onSelectLesson }) => (
  <Calendar<CalendarItem>
    localizer={localizer}
    events={lessons.map((lesson) => ({
      lesson,
      title: lesson.title,
      start: new Date(lesson.date),
      end: moment(lesson.date).add(lesson.durationMinutes || DEFAULT_DURATION, 'minutes').toDate(),
    }))}
    startAccessor="start"
    endAccessor="end"
    views={['month', 'week', 'day']}
    popup
    onSelectEvent={(item) => onSelectLesson(item.lesson)}
    style={{ height: 'clamp(420px, 70vh, 640px)' }}
    eventPropGetter={(item) => ({
      style: { backgroundColor: statusColors[item.lesson.status] || statusColors.scheduled, color: '#f0f6fc' },
    })}
  />
);

export default ScheduleCalendar;
