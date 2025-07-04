// EditScheduleModal.tsx
import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
    Select, FormControl, InputLabel, Grid, Paper, IconButton, Stack,
    Typography,
    Box
} from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

import './styles.scss'; 

const localizer = momentLocalizer(moment);

interface ScheduleEvent {
    _id?: string;
    student: string;
    coach?: string;
    title: string;
    description?: string;
    link?: string;
    type: string;
    date: string;
    status: string;
}

interface EditScheduleModalProps {
    open: boolean;
    onClose: () => void;
    student: any;
}

const formInputStyles = {
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    color: '#fff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.13)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.13)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#FFD700',
    },
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
};

const eventTypes = ["individual_lesson", "group_lesson", "homework", "opening_study", "tournament_participation"];

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ open, onClose, student }) => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Partial<ScheduleEvent>>({});

    const studentName = student ? `${student.firstName} ${student.lastName}` : '';

    const resetForm = () => {
        setSelectedEvent({
            student: student?._id,
            status: 'scheduled',
            title: '', type: '', date: '', description: '', link: ''
        });
    };

    const fetchSchedule = async () => {
        if (!student?._id) return;
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`http://localhost:3000/api/schedule/student/${student._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEvents(response.data);
        } catch (error) {
            notification.error({
                message: t('schedule.fetchError'),
                description: undefined
            });
        }
    };

    const handleSaveEvent = async () => {
        if (!selectedEvent.date || !selectedEvent.type || !selectedEvent.title) {
            notification.error({
                message: t('schedule.fieldRequired'),
                description: undefined
            });
            return;
        }

        const token = localStorage.getItem('token');
        const payload = {
            studentId: student._id,
            date: new Date(selectedEvent.date).toISOString(),
            title: selectedEvent.title,
            description: selectedEvent.description || "",
            link: selectedEvent.link || "",
            type: selectedEvent.type,
            status: selectedEvent.status
        };

        try {
            if (selectedEvent._id) { // Update existing
                await axios.put(`http://localhost:3000/api/schedule/${selectedEvent._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            } else { // Create new
                await axios.post('http://localhost:3000/api/schedule/create', payload, { headers: { Authorization: `Bearer ${token}` } });
            }
            notification.success({
                message: t('schedule.createSuccess'),
                description: undefined
            });
            fetchSchedule();
            resetForm();
        } catch (error: any) {
            notification.error({ message: t('schedule.createError'), description: error.response?.data?.msg });
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent._id) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:3000/api/schedule/${selectedEvent._id}`, { headers: { Authorization: `Bearer ${token}` } });
            notification.success({
                message: t('schedule.deleteSuccess'),
                description: undefined
            });
            fetchSchedule();
            resetForm();
        } catch (error) {
            notification.error({
                message: t('schedule.deleteError'),
                description: undefined
            });
        }
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedEvent({
            ...selectedEvent,
            _id: undefined, // ensure it's a new event
            date: moment(start).format('YYYY-MM-DDTHH:mm'),
        });
    };

    const handleSelectEvent = (event: any) => {
        setSelectedEvent({
            ...event,
            date: moment(event.date).format('YYYY-MM-DDTHH:mm'),
        });
    };

    useEffect(() => {
        if (open) {
            fetchSchedule();
            resetForm();
        }
    }, [open]);

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
                            events={events.map(event => ({ ...event, start: new Date(event.date), end: moment(event.date).add(1, 'hour').toDate() }))}
                            startAccessor="start" endAccessor="end" selectable
                            onSelectSlot={handleSelectSlot} onSelectEvent={handleSelectEvent}
                            views={['month', 'week', 'day']} style={{ height: 500 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3, bgcolor: 'transparent', boxShadow: 'none', height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                {selectedEvent._id ? t('schedule.eventDetails') : t('schedule.addEvent')}
                            </Typography>
                            <Stack spacing={2.5}>
                                <TextField
                                    label={t('schedule.form_title')} variant="filled" fullWidth
                                    value={selectedEvent.title || ''}
                                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                                    sx={formInputStyles}
                                />
                                <FormControl variant="filled" fullWidth sx={formInputStyles}>
                                    <InputLabel>{t('schedule.form_type')}</InputLabel>
                                    <Select value={selectedEvent.type || ''} onChange={(e) => setSelectedEvent({ ...selectedEvent, type: e.target.value })}>
                                        {eventTypes.map(type => (
                                            <MenuItem key={type} value={type}>{t(`schedule.${type}`)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label={t('schedule.form_description')} variant="filled" fullWidth multiline rows={3}
                                    value={selectedEvent.description || ''}
                                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                                    sx={formInputStyles}
                                />
                                <TextField
                                    label={t('schedule.form_link')} variant="filled" fullWidth
                                    value={selectedEvent.link || ''}
                                    onChange={(e) => setSelectedEvent({ ...selectedEvent, link: e.target.value })}
                                    sx={formInputStyles}
                                />
                                <TextField
                                    label={t('schedule.form_date')} type="datetime-local" variant="filled" fullWidth
                                    value={selectedEvent.date || ''}
                                    onChange={(e) => setSelectedEvent({ ...selectedEvent, date: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    sx={formInputStyles}
                                />
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#2a2a2a' }}>
                <Button onClick={onClose} sx={{ color: 'grey.500' }}>{t('schedule.close')}</Button>
                <Box sx={{ flex: '1 1 auto' }} /> 
                {selectedEvent._id && (
                    <Button onClick={handleDeleteEvent} variant="outlined" color="error" startIcon={<DeleteIcon />}>
                        {t('schedule.deleteEvent')}
                    </Button>
                )}
                <Button onClick={handleSaveEvent} variant="contained" sx={{ bgcolor: '#FFD700', color: 'black', '&:hover': { bgcolor: '#FFC107' } }} startIcon={selectedEvent._id ? <SaveIcon /> : <AddCircleOutlineIcon />}>
                    {selectedEvent._id ? t('schedule.updateEvent') : t('schedule.addEvent')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditScheduleModal;