import React from 'react';
import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { User } from '@/types/User';
import { ScheduleEvent } from '@/types/SheduleEvent';
import { MyCoachWidget } from './MyCoachWidget';
import { UpcomingLessonsWidget } from './UpcomingLessonsWidget';
import { HomeworkTodayWidget } from './HomeworkTodayWidget';

interface DashboardProps {
  user: User;
  coach: User | null;
  schedule: ScheduleEvent[];
  loadingCoach: boolean;
  loadingSchedule: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, coach, schedule, loadingCoach, loadingSchedule }) => {
  const { t } = useTranslation();
  const isStudentView = user.roles.includes('USER');

  if (!isStudentView) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
        {t('dashboard.coachAdminPlaceholder')}
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>{t('dashboard.title')}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <HomeworkTodayWidget />
        </Grid>
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