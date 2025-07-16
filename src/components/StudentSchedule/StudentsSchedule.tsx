// Файл: components/StudentSchedule/StudentsSchedule.tsx

import React, { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Paper, Tooltip, Typography } from '@mui/material';

// Иконки
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Типы
import { ScheduleEvent } from '@/types/SheduleEvent';

// Стили
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.scss';

// --- НАСТРОЙКИ И УТИЛИТЫ ---
const localizer = momentLocalizer(moment);

const eventTypeIcons = {
  individual_lesson: <EventNoteIcon fontSize="small" />,
  group_lesson: <PeopleIcon fontSize="small" />,
  homework: <AssignmentIcon fontSize="small" />,
  opening_study: <MenuBookIcon fontSize="small" />,
  tournament_participation: <EmojiEventsIcon fontSize="small" />,
};

// --- КОМПОНЕНТЫ ДЛЯ КАЛЕНДАРЯ ---

// Наш кастомный компонент для события в календаре
const CustomEvent: React.FC<{ event: ScheduleEvent & { start?: Date; end?: Date; } }> = ({ event }) => {
  const icon = eventTypeIcons[event.type as keyof typeof eventTypeIcons];
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

// --- ОСНОВНОЙ КОМПОНЕНТ КАЛЕНДАРЯ ---

// Определяем, какие пропсы будет принимать наш компонент
interface StudentScheduleProps {
  events: ScheduleEvent[]; // Массив событий для отображения
  onSelectEvent: (event: ScheduleEvent) => void; // Функция, которая вызовется при клике на событие
}

const StudentSchedule: React.FC<StudentScheduleProps> = ({ events, onSelectEvent }) => {

  // Преобразуем входящие события в формат, который понимает react-big-calendar
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      ...event, // Копируем все поля из нашего оригинального события
      start: new Date(event.date),
      end: moment(event.date).add(1, 'hour').toDate(), // Длительность 1 час для примера
    }));
  }, [events]); // Этот хук будет перезапускаться только если изменится пропс events

  return (
    <Paper className="schedule-paper" style={{ height: '70vh', padding: '16px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents} // <-- Используем преобразованные события
          startAccessor="start"
          endAccessor="end"
          views={['month', 'week', 'day', 'agenda']}
          components={{ event: CustomEvent as any }}
          onSelectEvent={onSelectEvent} // <-- Привязываем обработчик клика
          className="schedule-calendar-standalone"
        />
    </Paper>
  );
};

export default StudentSchedule;