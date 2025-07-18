import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { ScheduleEvent } from '@/types/SheduleEvent';

// Icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

// Стили статусов можно вынести сюда же
const statusStyles = {
  scheduled: { icon: <HourglassEmptyIcon fontSize="small" />, color: 'info' as const, labelKey: 'status.scheduled' },
  pending: { icon: <HourglassEmptyIcon fontSize="small" />, color: 'warning' as const, labelKey: 'status.pending' },
  completed: { icon: <CheckCircleOutlineIcon fontSize="small" />, color: 'success' as const, labelKey: 'status.completed' },
  approved: { icon: <CheckCircleOutlineIcon fontSize="small" />, color: 'success' as const, labelKey: 'status.approved' },
  rejected: { icon: <HighlightOffIcon fontSize="small" />, color: 'error' as const, labelKey: 'status.rejected' },
};
interface EventCardProps {
  event: ScheduleEvent;
  variant?: 'light' | 'dark'; // <-- Добавляем вариант для стилизации
  onSelect?: (event: ScheduleEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, variant = 'light', onSelect }) => {
  const { t } = useTranslation();
  
  const statusKey = event.status as keyof typeof statusStyles;
  const style = statusStyles[statusKey] || statusStyles.scheduled;

  // Определяем стили в зависимости от варианта
  const paperStyles = variant === 'dark'
    ? { bgcolor: '#2a2a2a', color: 'white' }
    : { bgcolor: 'white', color: 'black' };

  return (
    <Paper 
      onClick={onSelect ? () => onSelect(event) : undefined}
      sx={{ 
        ...paperStyles, // <-- Применяем нужные стили
        p: 2, 
        borderRadius: 2,
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'box-shadow 0.3s, transform 0.2s',
        '&:hover': onSelect ? { boxShadow: 6, transform: 'translateY(-2px)' } : {},
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" fontWeight={500} noWrap>{event.title}</Typography>
        <Chip icon={style.icon} label={t(style.labelKey)} color={style.color} size="small"/>
      </Box>
      <Typography variant="body2" color={variant === 'dark' ? 'grey.400' : 'text.secondary'}>
        {moment(event.date).format('MMMM Do, YYYY [at] HH:mm')}
      </Typography>
      {event.description && <Typography variant="body2" sx={{ mt: 1, color: variant === 'dark' ? 'grey.500' : 'text.secondary' }}>{event.description}</Typography>}
    </Paper>
  );
};