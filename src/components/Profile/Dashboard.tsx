import React from 'react';
import { Grid, Typography } from '@mui/material';
import { User } from '@/types/User';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { MyCoachWidget } from './MyCoachWidget';
import { UpcomingLessonsWidget } from './UpcomingLessonsWidget';

interface DashboardProps {
  user: User;
  coach: User | null;
  schedule: ScheduleEvent[];
  loadingCoach: boolean;
  loadingSchedule: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, coach, schedule, loadingCoach, loadingSchedule }) => {
  const isStudentView = user.roles.includes('student') || user.roles.includes('user');

  if (!isStudentView) {
    return (
      <Typography sx={{ color: 'grey.500', textAlign: 'center', p: 4 }}>
        This is your public coach/admin dashboard. More widgets coming soon.
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <MyCoachWidget coach={coach} isLoading={loadingCoach} />
        </Grid>
        <Grid item xs={12} md={6}>
          <UpcomingLessonsWidget schedule={schedule} isLoading={loadingSchedule} />
        </Grid>
      </Grid>
    </>
  );
};