import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  TextField, Typography,
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import { AxiosError } from 'axios';
import moment from 'moment';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { submitAssignment } from '@/api/homework';
import { AttachmentImage } from '@/components/Homework/AttachmentImage';
import { MyAssignment } from '@/types/Homework';
import { AskInChatButton } from '@/features/Chat';
import { ApiErrorBody } from '@/types/Student';
import { assignmentState, STATE_COLORS } from './assignmentState';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

interface AssignmentDialogProps {
  assignment: MyAssignment | null;
  onClose: () => void;
  onSubmitted: () => void;
}

/** ДЗ ученика: условие, срок, статус, комментарий тренера, предыдущий ответ и форма (пере)сдачи */
export const AssignmentDialog: React.FC<AssignmentDialogProps> = ({ assignment, onClose, onSubmitted }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Пересдача начинается с предыдущего ответа — его удобно поправить, а не набирать заново
    setText(assignment?.submission?.contentText ?? '');
    setFile(null);
    setError('');
  }, [assignment]);

  if (!assignment) return null;
  const { submission } = assignment;
  const state = assignmentState(assignment);
  const canSubmit = state !== 'approved';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError(t('homework.fileTypeError'));
      return;
    }
    if (picked.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(t('homework.fileTooLarge', { size: MAX_FILE_SIZE_MB }));
      return;
    }
    setError('');
    setFile(picked);
  };

  const handleSubmit = async () => {
    // Скриншот прошлой сдачи сохраняется на сервере, поэтому пересдать можно и без нового файла
    if (!text.trim() && !file && !submission?.attachment) {
      setError(t('homework.emptyError'));
      return;
    }
    setSubmitting(true);
    try {
      await submitAssignment(assignment._id, text, file);
      notification.success({ message: t(submission ? 'homework.resubmitted' : 'homework.submitted'), description: undefined });
      onSubmitted();
      onClose();
    } catch (e) {
      const body = (e as AxiosError<ApiErrorBody>).response?.data;
      if (body?.msg) setError(body.msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        {assignment.title}
        <Chip size="small" color={STATE_COLORS[state]} label={t(`homework.state.${state}`)} />
      </DialogTitle>
      <DialogContent dividers>
        {assignment.lesson && (
          <Typography variant="body2" color="text.secondary">
            {t('homework.forLesson', { title: assignment.lesson.title, date: moment(assignment.lesson.date).format('LLL') })}
          </Typography>
        )}
        {assignment.dueDate && (
          <Typography variant="body2" color={state === 'overdue' ? 'error' : 'text.secondary'}>
            {t('homework.due', { date: moment(assignment.dueDate).format('LL') })}
          </Typography>
        )}
        <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{assignment.description}</Typography>

        {submission?.review?.comment && (
          <Alert severity={submission.status === 'approved' ? 'success' : 'warning'} sx={{ mt: 2 }}>
            <strong>{t('homework.coachComment')}:</strong> {submission.review.comment}
          </Alert>
        )}

        {submission && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              {t('homework.yourAnswer', { date: moment(submission.submittedAt).format('LLL') })}
            </Typography>
            {submission.contentText && !canSubmit && (
              <Typography sx={{ whiteSpace: 'pre-wrap', p: 1, bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>{submission.contentText}</Typography>
            )}
            {submission.attachment && <AttachmentImage submissionId={submission._id} version={submission.submittedAt} />}
          </Box>
        )}

        {canSubmit && (
          <Box sx={{ mt: 3 }}>
            <TextField
              label={t('homework.answer')}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              multiline
              minRows={4}
              fullWidth
              inputProps={{ maxLength: 10000 }}
              disabled={submitting}
            />
            <Button sx={{ mt: 2 }} variant="outlined" component="label" startIcon={<BackupIcon />} disabled={submitting}>
              {file ? file.name : t(submission?.attachment ? 'homework.replaceScreenshot' : 'homework.uploadScreenshot')}
              <input type="file" hidden accept={ALLOWED_TYPES.join(',')} onChange={handleFile} />
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {/* Вопрос тренеру по этому заданию — отдельный диалог с темой задания */}
        <AskInChatButton
          size="small"
          context={{ kind: 'homework', refId: assignment._id, title: assignment.title }}
          sx={{ mr: 'auto' }}
        />
        <Button onClick={onClose} disabled={submitting}>{t('common.close')}</Button>
        {canSubmit && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {t(submission ? 'homework.resubmit' : 'homework.submit')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
