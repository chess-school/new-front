import React from 'react';
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Link, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Lesson } from '@/api/lessons';
import { MyAssignment } from '@/types/Homework';
import { safeUrl } from '@/utils';

const STATUS_COLORS = { scheduled: 'info', completed: 'success', cancelled: 'default', missed: 'error' } as const;

interface LessonDialogProps {
  lesson: Lesson | null;
  homework: MyAssignment | undefined;
  onClose: () => void;
  onOpenHomework: (assignment: MyAssignment) => void;
}

/** Детали занятия: время, длительность, ссылка на звонок и ДЗ к нему, если задано */
export const LessonDialog: React.FC<LessonDialogProps> = ({ lesson, homework, onClose, onOpenHomework }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!lesson) return null;

  // Живой «Интерактивный класс» (видео + учебная доска): групповые и индивидуальные занятия 1-на-1
  const canEnterClassroom = (lesson.context?.type === 'group' || lesson.context?.type === 'individual')
    && lesson.status !== 'cancelled';

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        {lesson.title}
        <Chip size="small" color={STATUS_COLORS[lesson.status]} label={t(`schedule.lessonStatus.${lesson.status}`)} />
      </DialogTitle>
      <DialogContent dividers>
        <Typography color="text.secondary">
          {moment(lesson.date).format('LLLL')}
          {lesson.durationMinutes ? ` · ${t('studentSchedule.duration', { minutes: lesson.durationMinutes })}` : ''}
        </Typography>
        {lesson.description && <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{lesson.description}</Typography>}
        {safeUrl(lesson.link) && (
          <Typography sx={{ mt: 2 }}>
            {t('studentSchedule.form_link')}: <Link href={safeUrl(lesson.link)} target="_blank" rel="noopener noreferrer">{lesson.link}</Link>
          </Typography>
        )}
        {!homework && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{t('studentSchedule.noHomework')}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
        {canEnterClassroom && (
          <Button variant="contained" color="success" startIcon={<VideoCameraFrontIcon />}
            onClick={() => navigate(`/classroom/${lesson._id}`)}>
            Войти в класс
          </Button>
        )}
        {homework && (
          <Button variant="contained" startIcon={<AssignmentIcon />} onClick={() => onOpenHomework(homework)}>
            {t('studentSchedule.openHomework')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
