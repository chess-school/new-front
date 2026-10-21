import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

import { createAssignment, deleteAssignment, getLessonAssignment, updateAssignment } from '@/api/homework';
import { Assignment } from '@/types/Homework';

interface LessonHomeworkEditorProps {
  lessonId: string;
}

/** ДЗ к занятию (тренер): задать, изменить, удалить. Ученик получит уведомление при создании. */
export const LessonHomeworkEditor: React.FC<LessonHomeworkEditorProps> = ({ lessonId }) => {
  const { t } = useTranslation();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLessonAssignment(lessonId)
      .then((a) => {
        if (cancelled) return;
        setAssignment(a);
        setDescription(a?.description ?? '');
        setDueDate(a?.dueDate ? moment(a.dueDate).format('YYYY-MM-DD') : '');
        setError('');
      })
      .catch(() => { /* ошибку показал перехватчик axios */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lessonId]);

  const handleSave = async () => {
    if (!description.trim()) {
      setError(t('schedule.fieldRequired'));
      return;
    }
    setSaving(true);
    try {
      const saved = assignment
        ? await updateAssignment(assignment._id, { description: description.trim(), dueDate: dueDate || null })
        : await createAssignment({ scheduleId: lessonId, description: description.trim(), dueDate: dueDate || undefined });
      setAssignment(saved);
      notification.success({ message: t(assignment ? 'homework.updated' : 'homework.created'), description: undefined });
    } catch {
      // ошибку уже показал перехватчик axios
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;
    setSaving(true);
    try {
      await deleteAssignment(assignment._id);
      setAssignment(null);
      setDescription('');
      setDueDate('');
      notification.success({ message: t('homework.deleted'), description: undefined });
    } catch {
      // 409 «уже есть сдачи» — сообщение показал перехватчик axios
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{t('homework.title')}</Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Stack spacing={2}>
          <TextField
            label={t('homework.description')}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(''); }}
            error={!!error}
            helperText={error || (assignment ? ' ' : t('homework.descriptionHelp'))}
            variant="filled"
            multiline
            minRows={2}
            inputProps={{ maxLength: 5000 }}
            fullWidth
          />
          <TextField
            label={t('homework.dueDate')}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            variant="filled"
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" size="small" onClick={handleSave} disabled={saving}>
              {assignment ? t('homework.save') : t('homework.assign')}
            </Button>
            {assignment && (
              <Button color="error" size="small" onClick={handleDelete} disabled={saving}>{t('homework.delete')}</Button>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  );
};
