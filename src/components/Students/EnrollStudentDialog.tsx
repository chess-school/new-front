import React, { useEffect, useState } from 'react';
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField,
} from '@mui/material';
import { AxiosError } from 'axios';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { enrollStudent, CoachCourse, CoachGroup } from '@/api/students';
import { ApiErrorBody } from '@/types/Student';

interface EnrollStudentDialogProps {
  open: boolean;
  onClose: () => void;
  onEnrolled: () => void;
  courses: CoachCourse[];
  groups: CoachGroup[];
}

type Field = 'email' | 'courseId' | 'groupId' | 'startDate';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EnrollStudentDialog: React.FC<EnrollStudentDialogProps> = ({ open, onClose, onEnrolled, courses, groups }) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<Field, string>>({ email: '', courseId: '', groupId: '', startDate: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({ email: '', courseId: courses.length === 1 ? courses[0]._id : '', groupId: '', startDate: '' });
      setErrors({});
    }
  }, [open, courses]);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const next: Partial<Record<Field, string>> = {};
    if (!EMAIL_RE.test(values.email.trim())) next.email = t('studentsPage.enroll.emailError');
    if (!values.courseId) next.courseId = t('studentsPage.enroll.required');
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await enrollStudent({
        email: values.email.trim(),
        courseId: values.courseId,
        groupId: values.groupId || undefined,
        startDate: values.startDate || undefined,
      });
      notification.success({ message: t('studentsPage.enroll.success'), description: undefined });
      onEnrolled();
      onClose();
    } catch (e) {
      // 422 — подсвечиваем поля, которые не прошли проверку на сервере (общее сообщение уже показано)
      const details = (e as AxiosError<ApiErrorBody>).response?.data?.details;
      if (details?.length) {
        setErrors(Object.fromEntries(details.map((d) => [d.field, d.message])) as Partial<Record<Field, string>>);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const activeGroups = groups.filter((g) => g.status === 'active');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('studentsPage.enroll.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label={t('studentsPage.enroll.email')}
            type="email"
            value={values.email}
            onChange={set('email')}
            error={!!errors.email}
            helperText={errors.email || t('studentsPage.enroll.emailHelp')}
            autoFocus
            fullWidth
          />
          <TextField
            select
            label={t('studentsPage.course')}
            value={values.courseId}
            onChange={set('courseId')}
            error={!!errors.courseId}
            helperText={errors.courseId || (courses.length === 0 ? t('studentsPage.noCourses') : ' ')}
            disabled={courses.length === 0}
            fullWidth
          >
            {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
          </TextField>
          <TextField
            select
            label={t('studentsPage.group')}
            value={values.groupId}
            onChange={set('groupId')}
            error={!!errors.groupId}
            helperText={errors.groupId || ' '}
            fullWidth
          >
            <MenuItem value="">{t('studentsPage.noGroup')}</MenuItem>
            {activeGroups.map((g) => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
          </TextField>
          <TextField
            label={t('studentsPage.enroll.startDate')}
            type="date"
            value={values.startDate}
            onChange={set('startDate')}
            error={!!errors.startDate}
            helperText={errors.startDate || ' '}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || courses.length === 0}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {t('studentsPage.enroll.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
