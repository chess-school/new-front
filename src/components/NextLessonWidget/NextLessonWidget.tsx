import React from 'react';
import { Paper, Skeleton, Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { EventCard } from '@/components/EventCard/EventCard';

interface NextLessonWidgetProps {
  schedule: ScheduleEvent[];
  isLoading: boolean;
  onEventSelect: (event: ScheduleEvent) => void;
}

export const NextLessonWidget: React.FC<NextLessonWidgetProps> = ({ schedule, isLoading, onEventSelect }) => {
  const { t } = useTranslation();
  if (isLoading) {
    return <Paper sx={{ p: 2, borderRadius: 3 }}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} /></Paper>;
  }
  
  // Находим ОДНО, самое ближайшее будущее событие
  const nextEvent = schedule
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]; // [0] - берем только первый элемент
  
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>{t('nextLesson.title')}</Typography>
      {nextEvent ? (
        // Если ближайший урок есть - показываем кликабельную карточку
        <EventCard 
            event={nextEvent} 
            variant="dark" 
            onSelect={onEventSelect} 
        />
      ) : (
        // Если уроков нет - показываем сообщение
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('nextLesson.empty')}</Typography>
        </Paper>
      )}

      {/* Кнопка для перехода к полному списку ВСЕГДА видна, если есть хоть какие-то уроки */}
      {schedule.length > 0 && (
         <Button
            component={RouterLink}
            to="/students-shedule" // Или на вкладку, если хотите
            fullWidth
            endIcon={<ArrowForwardIcon />}
            sx={{ 
                mt: 2,
                color: 'primary.main',
                justifyContent: 'flex-start',
                p: 1
            }}
        >
            {t('nextLesson.viewFullSchedule')}
        </Button>
      )}
    </Box>
  );
};