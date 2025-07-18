import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Chip, Box, Typography, Link as MuiLink } from '@mui/material';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import BackupIcon from '@mui/icons-material/Backup';
import { notification } from 'antd';
import { ScheduleEvent } from '@/types/SheduleEvent';
// Icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';


// Копируем statusStyles, т.к. они нужны для заголовка
import { HourglassEmpty } from '@mui/icons-material';
const statusStyles = {
  scheduled: { icon: <HourglassEmpty fontSize="small" />, color: 'info' as const, labelKey: 'status.scheduled' },
  pending: { icon: <HourglassEmptyIcon fontSize="small" />, color: 'warning' as const, labelKey: 'status.pending' },
  completed: { icon: <CheckCircleOutlineIcon fontSize="small" />, color: 'success' as const, labelKey: 'status.completed' },
  approved: { icon: <CheckCircleOutlineIcon fontSize="small" />, color: 'success' as const, labelKey: 'status.approved' },
  rejected: { icon: <HighlightOffIcon fontSize="small" />, color: 'error' as const, labelKey: 'status.rejected' },
};
const MAX_FILE_SIZE_MB = 5;

interface HomeworkDialogProps {
  event: ScheduleEvent | null;
  open: boolean;
  onClose: () => void;
  onSendHomework: (text: string, file: File | null) => Promise<void>;
}

export const HomeworkDialog: React.FC<HomeworkDialogProps> = ({ event, open, onClose, onSendHomework }) => {
  const { t } = useTranslation();
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
    try { await onSendHomework(homeworkText, screenshot); } 
    finally { setIsSubmitting(false); }
  };

  const statusKey = event.status as keyof typeof statusStyles;
  const style = statusStyles[statusKey] || statusStyles.scheduled;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ bgcolor: `${style.color}.main`, color: 'white' }}>{t('studentSchedule.eventDetails')}</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{event.title}</Typography>
          <Chip icon={style.icon} label={t(style.labelKey)} color={style.color} size="small"/>
        </Box>
        <Typography variant="body2" color="text.secondary">{moment(event.date).format('dddd, MMMM Do, YYYY [at] HH:mm')}</Typography>
        {event.description && <Typography variant="body1" sx={{ mt: 2 }}>{event.description}</Typography>}
        {event.link && <Typography variant="body2" sx={{ mt: 1 }}>{t('studentSchedule.form_link')}: <MuiLink href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</MuiLink></Typography>}
        {event.type === 'homework' && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{mb: 2}}>{t('studentSchedule.sendHomeworkTitle')}</Typography>
            <TextField label={t('studentSchedule.form_description')} fullWidth multiline rows={4} value={homeworkText} onChange={(e) => setHomeworkText(e.target.value)} variant="outlined" disabled={isSubmitting} />
            <Button sx={{mt: 2}} variant="outlined" component="label" startIcon={<BackupIcon />} disabled={isSubmitting}>
              {screenshot ? screenshot.name : t('studentSchedule.uploadScreenshot')}
              <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>{t('common.close')}</Button>
        {event.type === 'homework' && <Button onClick={handleSendClick} variant="contained" color="primary" disabled={isSubmitting}>{t('studentSchedule.send')}</Button>}
      </DialogActions>
    </Dialog>
  );
};