import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    MenuItem, Grid, Paper, IconButton, Stack, Typography, Box, Tooltip,
    useMediaQuery, useTheme,
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

// Local Imports
import {
  createIndividualLesson, deleteLesson, getMyLessons, updateLesson,
  Lesson, LessonStatus, LESSON_STATUSES,
} from '@/api/lessons';
import { LessonHomeworkEditor } from '@/components/Homework/LessonHomeworkEditor';

// SCSS Styles
import './styles.scss';

const localizer = momentLocalizer(moment);
const DEFAULT_DURATION = 60;

interface LessonForm {
    _id?: string;
    title: string;
    description: string;
    link: string;
    date: string; // формат datetime-local: YYYY-MM-DDTHH:mm
    durationMinutes: string;
    status: LessonStatus;
}

type FormErrors = Partial<Record<keyof LessonForm, string>>;

const emptyForm = (date = ''): LessonForm => ({
    title: '', description: '', link: '', date, durationMinutes: String(DEFAULT_DURATION), status: 'scheduled',
});

type CalendarLesson = BigCalendarEvent & { lesson: Lesson };

// Событие в календаре: иконка + название, подсказка с описанием
const CustomEvent: React.FC<{ event: CalendarLesson }> = ({ event }) => (
    <Tooltip title={event.lesson.description || event.lesson.title} placement="top">
        <div className={`custom-event rbc-event--individual_lesson rbc-event--status-${event.lesson.status}`}>
            <EventNoteIcon fontSize="small" />
            <Typography variant="caption" noWrap component="span">{event.lesson.title}</Typography>
        </div>
    </Tooltip>
);

interface EditScheduleModalProps {
    open: boolean;
    onClose: () => void;
    /** _id пользователя-студента: по нему бэкенд проверяет, что это ваш ученик */
    student: { _id: string; firstName: string; lastName: string } | null;
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ open, onClose, student }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [form, setForm] = useState<LessonForm>(emptyForm());
    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);

    const studentId = student?._id;

    const resetForm = useCallback((date = '') => {
        setForm(emptyForm(date));
        setErrors({});
    }, []);

    // API отдаёт всё расписание тренера — оставляем индивидуальные занятия этого ученика
    const fetchSchedule = useCallback(async () => {
        if (!studentId) return;
        try {
            const all = await getMyLessons();
            setLessons(all.filter((l) => l.context.type === 'individual' && String(l.context.refId) === studentId));
        } catch {
            notification.error({ message: t('schedule.fetchError'), description: undefined });
        }
    }, [studentId, t]);

    // Форма сбрасывается только при открытии/смене ученика. Отдельно от загрузки: fetchSchedule
    // меняется вместе с t (например, при смене языка), и общий эффект стирал бы набранное
    useEffect(() => {
        if (open && studentId) resetForm();
    }, [open, studentId, resetForm]);

    useEffect(() => {
        if (open && studentId) fetchSchedule();
    }, [open, studentId, fetchSchedule]);

    const validateForm = (): boolean => {
        const next: FormErrors = {};
        if (!form.title.trim()) next.title = t('schedule.fieldRequired');
        if (!form.date) next.date = t('schedule.fieldRequired');
        const duration = Number(form.durationMinutes);
        if (!Number.isInteger(duration) || duration < 5 || duration > 600) next.durationMinutes = t('schedule.durationError');
        if (form.link.trim() && !/^https?:\/\/\S+$/i.test(form.link.trim())) next.link = t('schedule.linkError');
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = async () => {
        if (!studentId || !validateForm()) return;
        const payload = {
            title: form.title.trim(),
            description: form.description,
            link: form.link.trim(),
            date: new Date(form.date).toISOString(),
            durationMinutes: Number(form.durationMinutes),
        };
        setSaving(true);
        try {
            if (form._id) await updateLesson(form._id, { ...payload, status: form.status });
            else await createIndividualLesson(studentId, payload);
            notification.success({
                message: t(form._id ? 'schedule.updateSuccess' : 'schedule.createSuccess'),
                description: undefined,
            });
            await fetchSchedule();
            resetForm();
        } catch {
            // ошибку уже показал перехватчик axios (например, «This user is not enrolled as your student»)
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!form._id) return;
        try {
            await deleteLesson(form._id);
            notification.success({ message: t('schedule.deleteSuccess'), description: undefined });
            await fetchSchedule();
            resetForm();
        } catch {
            // ошибку уже показал перехватчик axios
        }
    };

    const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
        resetForm(moment(start).format('YYYY-MM-DDTHH:mm'));
    }, [resetForm]);

    const handleSelectEvent = useCallback((event: CalendarLesson) => {
        const { lesson } = event;
        setErrors({});
        setForm({
            _id: lesson._id,
            title: lesson.title,
            description: lesson.description || '',
            link: lesson.link || '',
            date: moment(lesson.date).format('YYYY-MM-DDTHH:mm'),
            durationMinutes: String(lesson.durationMinutes || DEFAULT_DURATION),
            status: lesson.status,
        });
    }, []);

    const calendarEvents: CalendarLesson[] = useMemo(() => lessons.map((lesson) => ({
        lesson,
        title: lesson.title,
        start: new Date(lesson.date),
        end: moment(lesson.date).add(lesson.durationMinutes || DEFAULT_DURATION, 'minutes').toDate(),
    })), [lessons]);

    const dayPropGetter = useCallback((date: Date) => ({
        className: form.date && moment(date).isSame(form.date, 'day') ? 'rbc-selected-slot-custom' : '',
    }), [form.date]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    if (!student) return null;
    const studentName = `${student.firstName} ${student.lastName}`;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" fullScreen={fullScreen} className="schedule-dialog">
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
                        <Paper component="form" className="event-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            <Typography variant="h6" className="event-form__header">
                                {form._id
                                    ? t('schedule.eventDetails')
                                    : form.date
                                    ? t('schedule.addEventForDate', { date: moment(form.date).format('MMMM Do, YYYY') })
                                    : t('schedule.addEvent')}
                            </Typography>
                            <Stack spacing={2.5} className="event-form__fields">
                                <TextField name="title" label={t('schedule.form_title')} fullWidth
                                    value={form.title} onChange={handleChange} error={!!errors.title} helperText={errors.title}
                                    className="event-form__field" />

                                <TextField name="date" label={t('schedule.form_date')} type="datetime-local" fullWidth
                                    value={form.date} onChange={handleChange} error={!!errors.date} helperText={errors.date}
                                    InputLabelProps={{ shrink: true }} className="event-form__field" />

                                <TextField name="durationMinutes" label={t('schedule.form_duration')} type="number" fullWidth
                                    value={form.durationMinutes} onChange={handleChange} inputProps={{ min: 5, max: 600, step: 5 }}
                                    error={!!errors.durationMinutes} helperText={errors.durationMinutes} className="event-form__field" />

                                {form._id && (
                                    <TextField select name="status" label={t('schedule.form_status')} fullWidth
                                        value={form.status} onChange={handleChange} className="event-form__field">
                                        {LESSON_STATUSES.map((status) => (
                                            <MenuItem key={status} value={status}>{t(`schedule.lessonStatus.${status}`)}</MenuItem>
                                        ))}
                                    </TextField>
                                )}

                                <TextField name="description" label={t('schedule.form_description')} fullWidth multiline rows={3}
                                    value={form.description} onChange={handleChange} className="event-form__field" />

                                <TextField name="link" label={t('schedule.form_link')} fullWidth placeholder="https://meet.google.com/…"
                                    value={form.link} onChange={handleChange} error={!!errors.link} helperText={errors.link}
                                    className="event-form__field" />
                            </Stack>
                            {/* ДЗ задаётся к уже сохранённому занятию */}
                            {form._id && <LessonHomeworkEditor key={form._id} lessonId={form._id} />}
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions className="schedule-dialog__actions">
                <Button onClick={onClose} className="action-button action-button--close">{t('common.close')}</Button>
                <Box sx={{ flex: '1 1 auto' }} />
                {form._id && (
                    <Button onClick={() => resetForm()} className="action-button">{t('schedule.newLesson')}</Button>
                )}
                {form._id && (
                    <Button onClick={handleDelete} variant="outlined" color="error" startIcon={<DeleteIcon />} className="action-button action-button--delete">
                        {t('common.delete')}
                    </Button>
                )}
                <Button onClick={handleSave} disabled={saving} variant="contained" startIcon={form._id ? <SaveIcon /> : <AddCircleOutlineIcon />}
                    className="action-button action-button--save">
                    {form._id ? t('common.save') : t('common.add')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditScheduleModal;
