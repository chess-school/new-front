import React, { useEffect, useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Paper,
    IconButton,
    Stack,
    Typography,
    Box,
    SelectChangeEvent,
} from '@mui/material';
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

// 1. Импортируем наши API-функции из сервисного слоя
import { 
  getScheduleByStudent, 
  createScheduleEvent, 
  updateScheduleEvent, 
  deleteScheduleEvent 
} from '@/api/schedule';

// 2. Импортируем необходимые типы
import { Student } from '@/types/Student';
import { ScheduleEvent, ScheduleEventPayload } from '@/types/SheduleEvent';

// 3. Импортируем стили для календаря
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.scss'; 

const localizer = momentLocalizer(moment);

interface EditScheduleModalProps {
    open: boolean;
    onClose: () => void;
    student: Student;
}

// Константы и стили вынесены за пределы компонента
const formInputStyles = {
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    color: '#fff',
    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.13)' },
    '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 0.13)' },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': { color: '#FFD700' },
  },
  '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' },
};

const eventTypes: ScheduleEvent['type'][] = [
  "individual_lesson", 
  "group_lesson", 
  "homework", 
  "opening_study", 
  "tournament_participation"
];

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ open, onClose, student }) => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Partial<ScheduleEvent>>({});

    const studentName = student ? `${student.firstName} ${student.lastName}` : '';

    // Функция сброса формы, обернута в useCallback для оптимизации
    const resetForm = useCallback(() => {
        setSelectedEvent({
            student: student?._id,
            status: 'scheduled',
            title: '', 
            type: 'individual_lesson',
            date: '', 
            description: '', 
            link: ''
        });
    }, [student]);

    // Функция загрузки расписания
    const fetchSchedule = useCallback(async () => {
        if (!student?._id) return;
        try {
            const studentSchedule = await getScheduleByStudent(student._id);
            setEvents(studentSchedule);
        } catch (error) {
            console.error('Failed to fetch schedule:', error);
            // Уведомление об ошибке покажется автоматически из axios-интерсептора
        }
    }, [student]);

    // Функция сохранения (создания/обновления) события
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
            if (selectedEvent._id) {
                await updateScheduleEvent(selectedEvent._id, payload);
            } else {
                await createScheduleEvent(payload);
            }
            notification.success({
                message: t('schedule.saveSuccess'),
                description: undefined
            });
            fetchSchedule();
            resetForm();
        } catch (error) {
            console.error('Failed to save event:', error);
        }
    };

    // Функция удаления события
    const handleDeleteEvent = async () => {
        if (!selectedEvent._id) return;
        try {
            await deleteScheduleEvent(selectedEvent._id);
            notification.success({
                message: t('schedule.deleteSuccess'),
                description: undefined
            });
            fetchSchedule();
            resetForm();
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    // Обработчики календаря
    const handleSelectSlot = ({ start }: { start: Date }) => {
        resetForm();
        setSelectedEvent(prev => ({
            ...prev,
            date: moment(start).format('YYYY-MM-DDTHH:mm'),
        }));
    };

    const handleSelectEvent = (event: BigCalendarEvent & Partial<ScheduleEvent>) => {
        setSelectedEvent({
            ...event,
            date: event.date ? moment(event.date).format('YYYY-MM-DDTHH:mm') : '',
        });
    };
    
    // Эффект для загрузки данных при открытии модального окна
    useEffect(() => {
        if (open) {
            fetchSchedule();
            resetForm();
        }
    }, [open, fetchSchedule, resetForm]);

    // Преобразование данных для компонента календаря
    const calendarEvents = events.map(event => ({
      ...event,
      id: event._id,
      start: new Date(event.date),
      end: moment(event.date).add(1, 'hour').toDate(),
      title: event.title
    }));
    
    // Обработчики формы для контролируемых компонентов
    const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSelectedEvent(prev => ({ ...prev, [name]: value }));
    };
    
    const handleTypeChange = (e: SelectChangeEvent<string>) => {
        const value = e.target.value as ScheduleEvent['type'];
        setSelectedEvent(prev => ({ ...prev, type: value }));
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { bgcolor: '#1c1c1c', color: 'white', borderRadius: 4, backgroundImage: 'none' }}}>
            <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#2a2a2a' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div">{t('schedule.editScheduleTitle', { studentName })}</Typography>
                    <IconButton aria-label="close" onClick={onClose} sx={{ color: 'grey.500' }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.2)', p: {xs: 1, sm: 2, md: 3} }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Calendar
                            localizer={localizer}
                            events={calendarEvents}
                            startAccessor="start" endAccessor="end" selectable
                            onSelectSlot={handleSelectSlot} onSelectEvent={handleSelectEvent}
                            views={['month', 'week', 'day']} style={{ height: 500 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper component="form" sx={{ p: 3, bgcolor: 'transparent', boxShadow: 'none', height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                {selectedEvent._id ? t('schedule.eventDetails') : t('schedule.addEvent')}
                            </Typography>
                            <Stack spacing={2.5}>
                                <TextField
                                    name="title"
                                    label={t('schedule.form_title')} variant="filled" fullWidth
                                    value={selectedEvent.title || ''}
                                    onChange={handleFormInputChange}
                                    sx={formInputStyles}
                                />
                                <FormControl variant="filled" fullWidth sx={formInputStyles}>
                                    <InputLabel>{t('schedule.form_type')}</InputLabel>
                                    <Select name="type" value={selectedEvent.type || ''} onChange={handleTypeChange}>
                                        {eventTypes.map(type => (
                                            <MenuItem key={type} value={type}>{t(`schedule.eventTypes.${type}`)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    name="description"
                                    label={t('schedule.form_description')} variant="filled" fullWidth multiline rows={3}
                                    value={selectedEvent.description || ''}
                                    onChange={handleFormInputChange}
                                    sx={formInputStyles}
                                />
                                <TextField
                                    name="link"
                                    label={t('schedule.form_link')} variant="filled" fullWidth
                                    value={selectedEvent.link || ''}
                                    onChange={handleFormInputChange}
                                    sx={formInputStyles}
                                />
                                <TextField
                                    name="date"
                                    label={t('schedule.form_date')} type="datetime-local" variant="filled" fullWidth
                                    value={selectedEvent.date || ''}
                                    onChange={handleFormInputChange}
                                    InputLabelProps={{ shrink: true }}
                                    sx={formInputStyles}
                                />
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#2a2a2a' }}>
                <Button onClick={onClose} sx={{ color: 'grey.500' }}>{t('common.close')}</Button>
                <Box sx={{ flex: '1 1 auto' }} /> 
                {selectedEvent._id && (
                    <Button onClick={handleDeleteEvent} variant="outlined" color="error" startIcon={<DeleteIcon />}>
                        {t('common.delete')}
                    </Button>
                )}
                <Button onClick={handleSaveEvent} variant="contained" sx={{ bgcolor: '#FFD700', color: 'black', '&:hover': { bgcolor: '#FFC107' } }} startIcon={selectedEvent._id ? <SaveIcon /> : <AddCircleOutlineIcon />}>
                    {selectedEvent._id ? t('common.save') : t('common.add')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditScheduleModal;