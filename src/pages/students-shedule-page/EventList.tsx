import React, { useState } from 'react';
import { Box, Paper, Typography, ToggleButtonGroup, ToggleButton, CircularProgress, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { EventCard } from '@/components/EventCard/EventCard'; // Переиспользуемый EventCard

// Контролы и список в одном месте
interface EventListProps {
  events: ScheduleEvent[];
  isLoading: boolean;
  onEventSelect: (event: ScheduleEvent) => void;
}

const statusFilters = ['scheduled', 'pending', 'completed', 'approved', 'rejected'];

export const EventListContainer: React.FC<EventListProps> = ({ events, isLoading, onEventSelect }) => {
  const { t } = useTranslation();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const handleFilterChange = (_: React.MouseEvent<HTMLElement>, newFilters: string[]) => {
    setActiveFilters(newFilters);
  };
  
  const filteredEvents = React.useMemo(() => {
    if (activeFilters.length === 0) return events;
    return events.filter(event => activeFilters.includes(event.status));
  }, [events, activeFilters]);

  return (
    <Box mt={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">{t('studentSchedule.eventListTitle')}</Typography>
            <ToggleButtonGroup value={activeFilters} onChange={handleFilterChange} size="small">
                {statusFilters.map(key => (<ToggleButton key={key} value={key}>{t(`status.${key}`)}</ToggleButton>))}
            </ToggleButtonGroup>
        </Box>
        {isLoading ? (
          <Box sx={{display: 'flex', justifyContent: 'center', my: 4}}><CircularProgress /></Box>
        ) : (
          filteredEvents.length > 0 ? (
            <Grid container spacing={2}>
              {filteredEvents.map(event => (
                <Grid item xs={12} sm={6} md={4} key={event._id}>
                  <EventCard event={event} onSelect={onEventSelect} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}><Typography>{t('studentSchedule.noEventsFound')}</Typography></Paper>
          )
        )}
    </Box>
  );
};