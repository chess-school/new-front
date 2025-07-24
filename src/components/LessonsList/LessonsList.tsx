import React, { useMemo } from 'react';
import { Stack, Box, Typography, Skeleton, Paper, Divider } from '@mui/material';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { EventCard } from '@/components/EventCard/EventCard'; // Переиспользуем нашу универсальную карточку

interface LessonsListProps {
  schedule: ScheduleEvent[];
  isLoading: boolean;
  onEventSelect: (event: ScheduleEvent) => void;
}

export const LessonsList: React.FC<LessonsListProps> = ({ schedule, isLoading, onEventSelect }) => {
  // --- ЛОГИКА ЗАГРУЗКИ ---
  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2, bgcolor: 'grey.800' }} />
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2, bgcolor: 'grey.800' }} />
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2, bgcolor: 'grey.800' }} />
      </Stack>
    );
  }

  // --- START: НОВАЯ ЛОГИКА РАЗДЕЛЕНИЯ И СОРТИРОВКИ ---
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming: ScheduleEvent[] = [];
    const past: ScheduleEvent[] = [];

    schedule.forEach(event => {
      if (new Date(event.date) >= now) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    // Сортируем предстоящие от ближайшего к дальнему
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Сортируем прошедшие от самого недавнего к самому старому (обратная сортировка)
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [schedule]);
  // --- END: НОВАЯ ЛОГИКА ---

  // Если вообще нет уроков
  if (schedule.length === 0) {
    return (
      <Typography sx={{ color: 'grey.500', textAlign: 'center', p: 4 }}>
        You have no scheduled lessons yet.
      </Typography>
    );
  }

  return (
    // Используем React Fragment для группировки нескольких секций
    <>
      {/* --- СЕКЦИЯ ПРЕДСТОЯЩИХ УРОКОВ --- */}
      <Box mb={5}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Upcoming
        </Typography>
        {upcomingEvents.length > 0 ? (
          <Stack spacing={2}>
            {upcomingEvents.map(event => (
              <EventCard key={event._id} event={event} onSelect={onEventSelect} />
            ))}
          </Stack>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">You have no upcoming lessons.</Typography>
          </Paper>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

      {/* --- СЕКЦИЯ АРХИВА (ПРОШЕДШИХ УРОКОВ) --- */}
      <Box mt={4}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Archive
        </Typography>
        {pastEvents.length > 0 ? (
          <Stack spacing={2}>
            {pastEvents.map(event => (
              <EventCard key={event._id} event={event} onSelect={onEventSelect} />
            ))}
          </Stack>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Your lesson history is empty.</Typography>
          </Paper>
        )}
      </Box>
    </>
  );
};