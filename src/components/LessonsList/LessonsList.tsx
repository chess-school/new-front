import React, { useState, useMemo } from 'react';
import { Stack, Box, Typography, Skeleton, Paper, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { EventCard } from '@/components/EventCard/EventCard';

interface LessonsListProps {
  schedule: ScheduleEvent[];
  isLoading: boolean;
  onEventSelect: (event: ScheduleEvent) => void;
}

const statusFilters = ['scheduled', 'pending', 'completed', 'approved', 'rejected'];

export const LessonsList: React.FC<LessonsListProps> = ({ schedule, isLoading, onEventSelect }) => {
  const { t } = useTranslation();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcoming: ScheduleEvent[] = [];
    const past: ScheduleEvent[] = [];

    const filteredSchedule = activeFilters.length > 0
      ? schedule.filter(event => activeFilters.includes(event.status))
      : schedule;

    filteredSchedule.forEach(event => {
      if (new Date(event.date) >= now) upcoming.push(event);
      else past.push(event);
    });

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [schedule, activeFilters]);
  
  const handleFilterChange = (_: React.MouseEvent<HTMLElement>, newFilters: string[]) => {
    setActiveFilters(newFilters);
  };
  if (isLoading) {
    return (
      <Stack spacing={2} mt={4}>
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 2 }} />
      </Stack>
    );
  }
  
  if (schedule.length > 0 && upcomingEvents.length === 0 && pastEvents.length === 0) {
      return (
        <Paper sx={{p: 4, textAlign: 'center', mt: 4}}>
            <Typography color="text.secondary">No lessons match the selected filters.</Typography>
        </Paper>
      );
  }

  if (schedule.length === 0) {
    return (
      <Typography sx={{ color: 'grey.500', textAlign: 'center', p: 4, mt: 4 }}>
        You have no scheduled lessons yet.
      </Typography>
    );
  }
  
  return (
    <Box mt={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">{t('studentSchedule.eventListTitle')}</Typography>
            <ToggleButtonGroup value={activeFilters} onChange={handleFilterChange} size="small" aria-label="Filter by status">
                {statusFilters.map(key => (<ToggleButton key={key} value={key}>{t(`status.${key}`)}</ToggleButton>))}
            </ToggleButtonGroup>
        </Box>
        
        {upcomingEvents.length > 0 && (
            <Box mb={5}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>Upcoming</Typography>
                <Stack spacing={2}>
                    {upcomingEvents.map(event => <EventCard key={event._id} event={event} onSelect={onEventSelect} />)}
                </Stack>
            </Box>
        )}

        {upcomingEvents.length > 0 && pastEvents.length > 0 &&
            <Divider sx={{ my: 4 }} />
        }
        
        {pastEvents.length > 0 && (
            <Box>
                <Typography variant="h6" fontWeight="medium" gutterBottom>Archive</Typography>
                <Stack spacing={2}>
                    {pastEvents.map(event => <EventCard key={event._id} event={event} onSelect={onEventSelect} />)}
                </Stack>
            </Box>
        )}
    </Box>
  );
};