import React from 'react';
import { Paper, Skeleton, Stack, Box, Typography, Button, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { EventCard } from '@/components/EventCard/EventCard';

interface UpcomingLessonsWidgetProps {
  schedule: ScheduleEvent[];
  isLoading: boolean;
}
const DISPLAY_LIMIT = 3;

export const UpcomingLessonsWidget: React.FC<UpcomingLessonsWidgetProps> = ({ schedule, isLoading }) => {
  if (isLoading) return <Paper sx={{ p: 2, bgcolor: '#2a2a2a', borderRadius: 3, height: '100%' }}><Skeleton variant="rectangular" height={240} sx={{bgcolor: 'grey.700', borderRadius: 2}} /></Paper>;

  const upcomingEvents = schedule
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const displayedEvents = upcomingEvents.slice(0, DISPLAY_LIMIT);
  
  return (
    <Paper sx={{ p: 2, bgcolor: '#2a2a2a', color: 'white', borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <EventIcon sx={{ color: '#FFD700' }}/>
        <Typography variant="h6">Upcoming Lessons</Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {displayedEvents.length > 0 ? (
          <Stack spacing={2}>
            {displayedEvents.map(event => <EventCard key={event._id} event={event} variant="dark" />)}
          </Stack>
        ) : (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Typography sx={{color: 'grey.500'}}>No upcoming lessons.</Typography>
          </Box>
        )}
      </Box>
      {upcomingEvents.length > DISPLAY_LIMIT && (
        <>
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.12)' }}/>
            <Button component={RouterLink} to="/students-shedule" fullWidth endIcon={<ArrowForwardIcon />} sx={{ color: '#FFD700', justifyContent: 'space-between' }}>
                View Full Schedule ({upcomingEvents.length})
            </Button>
        </>
      )}
    </Paper>
  );
};