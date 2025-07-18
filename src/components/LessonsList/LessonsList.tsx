import React from 'react';
import { Stack, Typography, Skeleton } from '@mui/material';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { EventCard } from '@/components/EventCard/EventCard'; // Переиспользуем нашу универсальную карточку

interface LessonsListProps {
  schedule: ScheduleEvent[];
  isLoading: boolean;
  onEventSelect: (event: ScheduleEvent) => void;
}

export const LessonsList: React.FC<LessonsListProps> = ({ schedule, isLoading, onEventSelect }) => {
  if (isLoading) {
    // Показываем несколько скелетонов, чтобы было видно, что идет загрузка списка
    return (
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2, bgcolor: 'grey.800' }} />
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2, bgcolor: 'grey.800' }} />
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2, bgcolor: 'grey.800' }} />
      </Stack>
    );
  }

  if (schedule.length === 0) {
    return (
      <Typography sx={{ color: 'grey.500', textAlign: 'center', p: 4 }}>
        You have no scheduled lessons yet.
      </Typography>
    );
  }

  // Сортируем уроки так, чтобы самые новые (или будущие) были наверху
  const sortedSchedule = [...schedule].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Stack spacing={2}>
      {sortedSchedule.map(event => (
        // Карточки теперь кликабельные, потому что мы передаем onSelect
        <EventCard key={event._id} event={event} onSelect={onEventSelect} />
      ))}
    </Stack>
  );
};