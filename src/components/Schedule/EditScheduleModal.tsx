import React, { useEffect, useState, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    MenuItem, Select, FormControl, InputLabel, Grid, Paper, IconButton,
    Stack, Typography, Box, SelectChangeEvent, Tooltip,
} from '@mui/material';
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

// MUI Icons
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Local Imports
import {
  getScheduleByStudent, createScheduleEvent,
  updateScheduleEvent, deleteScheduleEvent
} from '@/api/schedule';
import { Student } from '@/types/Student';
import { ScheduleEvent, ScheduleEventPayload } from '@/types/SheduleEvent';

// SCSS Styles
import './styles.scss';

const localizer = momentLocalizer(moment);

// Иконки для типов событий
const eventTypeIcons = {
  individual_lesson: <EventNoteIcon fontSize="small" />,
  group_lesson: <PeopleIcon fontSize="small" />,
  homework: <AssignmentIcon fontSize="small" />,
  opening_study: <MenuBookIcon fontSize="small" />,
  tournament_participation: <EmojiEventsIcon fontSize="small" />,
};

const eventTypes: (keyof typeof eventTypeIcons)[] = [
    "individual_lesson", "group_lesson", "homework",
    "opening_study", "tournament_participation"
];

// Кастомный компонент для отображения события в календаре
const CustomEvent: React.FC<{ event: BigCalendarEvent & Partial<ScheduleEvent> }> = ({ event }) => {
  const eventType = event.type as keyof typeof eventTypeIcons;
  if (!eventType) return null;

  const icon = eventTypeIcons[eventType];
  const className = `custom-event rbc-event--${eventType}`;

  return (
    <Tooltip title={event.description || event.title} placement="top">
      <div className={className}>
        {icon}
        <Typography variant="caption" noWrap component="span">{event.title}</Typography>
      </div>
    </Tooltip>
  );
};


interface EditScheduleModalProps {
    open: boolean;
    onClose: () => void;
    student: Student | null;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ open, onClose, student }) => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Partial<ScheduleEvent>>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    if (!student) return null;

    const studentName = `${student.firstName} ${student.lastName}`;

    const resetForm = useCallback(() => {
        setSelectedEvent({
            student: student._id, status: 'scheduled',
            title: '', type: 'individual_lesson', date: '',
            description: '', link: ''
        });
        setSelectedDate(null);
    }, [student]);

    const fetchSchedule = useCallback(async () => {
        if (!student._id) return;
        try {
            const studentSchedule = await getScheduleByStudent(student._id);
            setEvents(studentSchedule);
        } catch (error) {
            console.error('Failed to fetch schedule:', error);
            notification.error({
                message: t('schedule.fetchError'),
                description: undefined
            });
        }
    }, [student, t]);
    
    // --- ПОЛНАЯ ЛОГИКА СОХРАНЕНИЯ ---
    const handleSaveEvent = async () => {
        const { date, type, title } = selectedEvent;
        if (!date || !type || !title) {
            notification.error({
                message: t('schedule.fieldRequired'),
                description: undefined
            });
            return;
        }

        const payload: ScheduleEventPayload = {
            studentId: student._id,
            date: new Date(date).toISOString(),
            title: title,
            description: selectedEvent.description || "",
            link: selectedEvent.link || "",
            type: type,
            status: selectedEvent.status || 'scheduled',
        };

        try {
            const isUpdating = !!selectedEvent._id;
            if (isUpdating) {
                await updateScheduleEvent(selectedEvent._id!, payload);
            } else {
                await createScheduleEvent(payload);
            }
            notification.success({
                message: t(isUpdating ? 'schedule.updateSuccess' : 'schedule.createSuccess'),
                description: undefined
            });
            await fetchSchedule();
            resetForm();
        } catch (error) {
            console.error('Failed to save event:', error);
        }
    };
    
    // --- ПОЛНАЯ ЛОГИКА УДАЛЕНИЯ ---
    const handleDeleteEvent = async () => {
        if (!selectedEvent._id) return;
        try {
            await deleteScheduleEvent(selectedEvent._id);
            notification.success({
                message: t('schedule.deleteSuccess'),
                description: undefined
            });
            await fetchSchedule();
            resetForm();
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    useEffect(() => {
        if (open && student) {
            fetchSchedule();
            resetForm();
        }
    }, [open, student, fetchSchedule, resetForm]);

    const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
        resetForm();
        setSelectedDate(start);
        setSelectedEvent(prev => ({
            ...prev,
            date: moment(start).format('YYYY-MM-DDTHH:mm'),
        }));
    }, [resetForm]);

    const handleSelectEvent = useCallback((event: BigCalendarEvent & Partial<ScheduleEvent>) => {
        setSelectedDate(event.date ? new Date(event.date) : null);
        setSelectedEvent({
            ...event,
            date: event.date ? moment(event.date).format('YYYY-MM-DDTHH:mm') : '',
        });
    }, []);

    const calendarEvents = events.map(event => ({
      ...event, id: event._id, start: new Date(event.date),
      end: moment(event.date).add(1, 'hour').toDate(), title: event.title,
    }));
    
    const dayPropGetter = useCallback((date: Date) => ({
        className: (selectedDate && moment(date).isSame(selectedDate, 'day'))
            ? 'rbc-selected-slot-custom'
            : '',
    }), [selectedDate]);

    const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSelectedEvent(prev => ({ ...prev, [name]: value }));
    };
    
    const handleTypeChange = (e: SelectChangeEvent<string>) => {
        setSelectedEvent(prev => ({ ...prev, type: e.target.value as ScheduleEvent['type'] }));
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" className="schedule-dialog">
            <DialogTitle className="schedule-dialog__header">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div">{t('schedule.editScheduleTitle', { studentName })}</Typography>
                    <IconButton aria-label="close" onClick={onClose} className="schedule-dialog__close-btn">
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers className="schedule-dialog__content">
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Calendar
                            localizer={localizer}
                            events={calendarEvents}
                            startAccessor="start" endAccessor="end"
                            selectable onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            components={{ event: CustomEvent }}
                            dayPropGetter={dayPropGetter}
                            className="schedule-calendar"
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper component="form" className="event-form" onSubmit={(e) => { e.preventDefault(); handleSaveEvent(); }}>
                            <Typography variant="h6" className="event-form__header">
                                {selectedEvent._id
                                    ? t('schedule.eventDetails')
                                    : selectedDate
                                    ? t('schedule.addEventForDate', { date: moment(selectedDate).format('MMMM Do, YYYY') })
                                    : t('schedule.addEvent')
                                }
                            </Typography>
                            <Stack spacing={2.5} className="event-form__fields">
                                <TextField name="title" label={t('schedule.form_title')} variant="filled" fullWidth
                                    value={selectedEvent.title || ''} onChange={handleFormInputChange} className="event-form__field"/>
                                
                                <FormControl variant="filled" fullWidth className="event-form__field">
                                    <InputLabel>{t('schedule.form_type')}</InputLabel>
                                    <Select name="type" value={selectedEvent.type || ''} onChange={handleTypeChange}>
                                        {eventTypes.map(type => (
                                            <MenuItem key={type} value={type}>{t(`schedule.eventTypes.${type}`)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                
                                <TextField name="description" label={t('schedule.form_description')} variant="filled" fullWidth multiline rows={3}
                                    value={selectedEvent.description || ''} onChange={handleFormInputChange} className="event-form__field"/>

                                <TextField name="link" label={t('schedule.form_link')} variant="filled" fullWidth
                                    value={selectedEvent.link || ''} onChange={handleFormInputChange} className="event-form__field"/>
                                
                                <TextField name="date" label={t('schedule.form_date')} type="datetime-local" variant="filled" fullWidth
                                    value={selectedEvent.date || ''} onChange={handleFormInputChange}
                                    InputLabelProps={{ shrink: true }} className="event-form__field"/>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions className="schedule-dialog__actions">
                <Button onClick={onClose} className="action-button action-button--close">{t('common.close')}</Button>
                <Box sx={{ flex: '1 1 auto' }} /> 
                {selectedEvent._id && (
                    <Button onClick={handleDeleteEvent} variant="outlined" startIcon={<DeleteIcon />} className="action-button action-button--delete">
                        {t('common.delete')}
                    </Button>
                )}
                <Button onClick={handleSaveEvent} variant="contained" startIcon={selectedEvent._id ? <SaveIcon /> : <AddCircleOutlineIcon />} className="action-button action-button--save">
                    {selectedEvent._id ? t('common.save') : t('common.add')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditScheduleModal;