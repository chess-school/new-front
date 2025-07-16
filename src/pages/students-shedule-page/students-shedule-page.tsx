import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Box, Chip, Link as MuiLink,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import moment from 'moment';
import { notification } from 'antd';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

// Icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import BackupIcon from '@mui/icons-material/Backup';

// API & Types
import { getScheduleByStudent } from '@/api/schedule';
import { sendHomework } from '@/api/homework';
import { createNotification } from '@/api/notifications';
import { ScheduleEvent } from '@/types/SheduleEvent';

// Импортируем готовый компонент календаря
import StudentSchedule from '@/components/StudentSchedule/StudentsSchedule';

// Styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.scss';

// --- КОНСТАНТЫ И УТИЛИТЫ ---
const MAX_FILE_SIZE_MB = 5;

const statusStyles = {
  scheduled: { icon: <HourglassEmptyIcon fontSize="small" />, color: 'info', labelKey: 'status.scheduled' },
  pending: { icon: <HourglassEmptyIcon fontSize="small" />, color: 'warning', labelKey: 'status.pending' },
  completed: { icon: <CheckCircleOutlineIcon fontSize="small" />, color: 'success', labelKey: 'status.completed' },
  approved: { icon: <CheckCircleOutlineIcon fontSize="small" />, color: 'success', labelKey: 'status.approved' },
  rejected: { icon: <HighlightOffIcon fontSize="small" />, color: 'error', labelKey: 'status.rejected' },
};
const STATUS_KEYS = Object.keys(statusStyles);

// --- === ДОЧЕРНИЕ КОМПОНЕНТЫ === ---

// --- 1. Карточка События ---
const EventCard: React.FC<{ event: ScheduleEvent; onSelect: (event: ScheduleEvent) => void; t: TFunction; }> = ({ event, onSelect, t }) => {
  const statusKey = event.status as keyof typeof statusStyles;
  const style = statusStyles[statusKey] || statusStyles.scheduled;
  return (
    <Paper className={`event-card event-card--${style.color}`} onClick={() => onSelect(event)}>
      <Box className="event-card__header">
        <Typography variant="h6" className="event-card__title">{event.title}</Typography>
        <Chip icon={style.icon} label={t(style.labelKey)} color={style.color as any} size="small"/>
      </Box>
      <Typography variant="body2" className="event-card__date">{moment(event.date).format('MMMM Do, YYYY [at] HH:mm')}</Typography>
      {event.description && <Typography variant="body2" className="event-card__description">{event.description}</Typography>}
    </Paper>
  );
};

// --- 2. Список Событий ---
const EventList: React.FC<{ events: ScheduleEvent[]; onSelectEvent: (event: ScheduleEvent) => void; t: TFunction; }> = ({ events, onSelectEvent, t }) => (
  <Box className="event-list">
    {events.length === 0 ? (
      <Paper className="event-list__empty"><Typography>{t('studentSchedule.noEventsForDay')}</Typography></Paper>
    ) : (
      events.map(event => <EventCard key={event._id} event={event} onSelect={onSelectEvent} t={t} />)
    )}
  </Box>
);

// --- 3. Панель Фильтров ---
const EventListControls: React.FC<{ statusFilters: string[]; onFilterChange: (filters: string[]) => void; t: TFunction; }> = ({ statusFilters, onFilterChange, t }) => {
  const handleFilterChange = (_event: React.MouseEvent<HTMLElement>, newFilters: string[]) => onFilterChange(newFilters);
  return (
    <Paper className="event-controls">
        <Typography variant="button" className="event-controls__label">{t('common.filterByStatus')}:</Typography>
        <ToggleButtonGroup value={statusFilters} onChange={handleFilterChange} size="small">
          {STATUS_KEYS.map(key => (<ToggleButton key={key} value={key} className="filter-toggle-button">{t(statusStyles[key as keyof typeof statusStyles].labelKey)}</ToggleButton>))}
        </ToggleButtonGroup>
    </Paper>
  );
};

// --- 4. Модальное окно ДЗ ---
const HomeworkDialog: React.FC<{
  event: ScheduleEvent | null; open: boolean; onClose: () => void;
  onSendHomework: (text: string, file: File | null) => Promise<void>; t: TFunction;
}> = ({ event, open, onClose, onSendHomework, t }) => {
  const [homeworkText, setHomeworkText] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setHomeworkText('');
      setScreenshot(null);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!event) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        notification.error({
          message: t('errors.fileTooLarge', { size: MAX_FILE_SIZE_MB }),
          description: undefined
        });
        return;
      }
      setScreenshot(file);
    }
  };

  const handleSendClick = async () => {
    if (!homeworkText.trim() && !screenshot) {
      notification.error({
        message: t('errors.emptyHomework'),
        description: undefined
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSendHomework(homeworkText, screenshot);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusKey = event.status as keyof typeof statusStyles;
  const style = statusStyles[statusKey] || statusStyles.scheduled;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" className="details-dialog">
      <DialogTitle className={`details-dialog__header details-dialog__header--${style.color}`}>{t('studentSchedule.eventDetails')}</DialogTitle>
      <DialogContent className="details-dialog__content">
        <Box className="details-dialog__info">
          <Typography variant="h6" className="details-dialog__title">{event.title}</Typography>
          <Chip icon={style.icon} label={t(style.labelKey)} color={style.color as any} size="small"/>
        </Box>
        <Typography variant="body2">{moment(event.date).format('dddd, MMMM Do, YYYY [at] HH:mm')}</Typography>
        {event.description && <Typography variant="body1" sx={{ mt: 2 }}>{event.description}</Typography>}
        {event.link && <Typography variant="body2" sx={{ mt: 1 }}>{t('studentSchedule.form_link')}: <MuiLink href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</MuiLink></Typography>}
        {event.type === 'homework' && (
          <Box className="homework-form">
            <Typography variant="h6" className="homework-form__title">{t('studentSchedule.sendHomeworkTitle')}</Typography>
            <TextField label={t('studentSchedule.form_description')} fullWidth multiline rows={4} value={homeworkText} onChange={(e) => setHomeworkText(e.target.value)} variant="filled" disabled={isSubmitting} />
            <Button variant="outlined" component="label" startIcon={<BackupIcon />} disabled={isSubmitting}>
              {screenshot ? screenshot.name : t('studentSchedule.uploadScreenshot')}
              <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions className="details-dialog__actions">
        <Button onClick={onClose} disabled={isSubmitting}>{t('common.close')}</Button>
        {event.type === 'homework' && <Button onClick={handleSendClick} variant="contained" color="primary" disabled={isSubmitting}>{t('studentSchedule.send')}</Button>}
      </DialogActions>
    </Dialog>
  );
};

// --- === ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ === ---
const StudentSchedulePage: React.FC = () => {
  const { t } = useTranslation();
  const [allEvents, setAllEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventForDialog, setSelectedEventForDialog] = useState<ScheduleEvent | null>(null);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  // Переносим логику получения ID и загрузку данных в один useEffect.
  useEffect(() => {
    const fetchScheduleForStudent = async () => {
      const userStr = localStorage.getItem('user');
      let studentId = null;
      try {
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
            studentId = JSON.parse(userStr)._id;
        }
      } catch (error) {
        console.error("Ошибка парсинга пользователя из localStorage:", error);
      }
      
      if (!studentId) {
        setLoading(false);
        notification.error({
          message: t('errors.userNotFound'),
          description: undefined
        });
        return;
      }
      
      setLoading(true);
      try {
        const scheduleData = await getScheduleByStudent(studentId);
        setAllEvents(scheduleData);
      } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
        notification.error({
          message: t('errors.fetchSchedule'),
          description: undefined
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleForStudent();
  }, [t]); // Зависимость от 't' нужна для доступа к переводам в notification.

  const handleOpenDialog = (event: ScheduleEvent) => setSelectedEventForDialog(event);
  const handleCloseDialog = () => setSelectedEventForDialog(null);
  
  const handleSendHomework = async (homeworkText: string, screenshot: File | null) => {
    // Получаем ID студента снова, чтобы не хранить его в состоянии
    const userStr = localStorage.getItem('user');
    const studentId = userStr ? JSON.parse(userStr)._id : null;
    if (!studentId || !selectedEventForDialog) return;

    try {
      await sendHomework({
        studentId,
        scheduleId: selectedEventForDialog._id,
        homeworkText: homeworkText.trim() ? homeworkText : undefined,
        screenshot: screenshot || undefined,
      });

      if (selectedEventForDialog.coach) {
        await createNotification({
            recipient: selectedEventForDialog.coach,
            type: 'homework_submission',
            content: `Ученик отправил домашнее задание по теме: "${selectedEventForDialog.title}"`,
            metadata: { scheduleId: selectedEventForDialog._id },
        });
      }
      notification.success({
        message: t('studentSchedule.homeworkSentSuccess'),
        description: undefined
      });
      handleCloseDialog();
      // Чтобы не делать еще один запрос к API, можно обновить состояние локально.
      // Это быстрее для пользователя.
      setAllEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === selectedEventForDialog._id ? { ...event, status: 'pending' } : event
        )
      );
    } catch (error) {
      console.error('Ошибка при отправке ДЗ:', error);
      notification.error({
        message: t('errors.sendHomework'),
        description: undefined
      });
    }
  };

  const filteredEvents = useMemo(() => {
    let events = [...allEvents];
    if (statusFilters.length > 0) {
      events = events.filter(event => statusFilters.includes(event.status));
    }
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allEvents, statusFilters]);

  return (
    <Box className="student-schedule-v2-page">
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" className="page-title">{t('studentSchedule.myScheduleTitle')}</Typography>

        {/* Передаем отфильтрованные данные и обработчик в дочерний компонент календаря */}
        <StudentSchedule 
          events={filteredEvents} 
          onSelectEvent={handleOpenDialog} 
        />

        <Box className="list-controls-container">
            <Typography variant="h5" component="h2">{t('studentSchedule.eventListTitle')}</Typography>
            <EventListControls 
                statusFilters={statusFilters}
                onFilterChange={setStatusFilters}
                t={t}
            />
        </Box>
        
        {loading ? ( <Box className="loader-container"><CircularProgress className="loader" /></Box> ) 
                 : ( <EventList events={filteredEvents} onSelectEvent={handleOpenDialog} t={t} /> )}
      </Container>
      
      <HomeworkDialog
        event={selectedEventForDialog} open={!!selectedEventForDialog}
        onClose={handleCloseDialog} onSendHomework={handleSendHomework}
        t={t}
      />
    </Box>
  );
};

export default StudentSchedulePage;