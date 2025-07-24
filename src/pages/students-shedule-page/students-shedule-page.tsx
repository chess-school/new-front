import React, { useEffect, useState, useMemo } from 'react';
import { Container, Typography, Box, Paper, CircularProgress, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';

// API & Types
import { getScheduleByStudent } from '@/api/schedule';
import { sendHomework } from '@/api/homework';
import { createNotification } from '@/api/notifications';
import { ScheduleEvent } from '@/types/SheduleEvent';

// Хуки и компоненты
import { useAuthUser } from '@/hooks/useStudent';
import ScheduleCalendar from '@/shared/components/Calendar/SheduleCalendar';
import { LessonsList } from '@/components/LessonsList/LessonsList'; // <-- ИСПОЛЬЗУЕМ НАШ НОВЫЙ КОМПОНЕНТ
import { HomeworkDialog } from '@/components/HomeworkDialog/HomeworkDialog';

const StudentSchedulePage: React.FC = () => {
  const { t } = useTranslation();
  const { userId, user: student, isAuthLoading } = useAuthUser();
  
  const [allEvents, setAllEvents] = useState<ScheduleEvent[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  useEffect(() => {
    if (isAuthLoading) return; // Ждем, пока AuthContext будет готов
    
    if (!userId) { // Если ID так и не появился - пользователь не тот, кто нам нужен
      setIsLoadingSchedule(false);
      return;
    }

    getScheduleByStudent(userId)
      .then(setAllEvents)
      .catch(() => notification.error({
        message: t('errors.fetchSchedule'),
        description: undefined
      }))
      .finally(() => setIsLoadingSchedule(false));

  }, [t, userId, isAuthLoading]);
  
   const handleSendHomework = async (homeworkText: string, screenshot: File | null) => {
    if (!userId || !selectedEvent) return;

    try {
      await sendHomework({
        studentId: userId,
        scheduleId: selectedEvent._id,
        homeworkText: homeworkText.trim() || undefined,
        screenshot: screenshot || undefined,
      });

      if (selectedEvent.coach && student) {
        await createNotification({
            recipient: selectedEvent.coach,
            type: 'homework_submission',
            content: `Student ${student.firstName} submitted homework for "${selectedEvent.title}"`,
            metadata: { scheduleId: selectedEvent._id },
        });
      }
      
      notification.success({
        message: t('studentSchedule.homeworkSentSuccess'),
        description: undefined
      });
      setSelectedEvent(null); // Закрываем модальное окно
      
      // Оптимистичное обновление UI, чтобы не перезапрашивать все расписание
      setAllEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === selectedEvent._id ? { ...event, status: 'pending' } : event
        )
      );
    } catch (error) {
      notification.error({
        message: t('errors.sendHomework'),
        description: undefined
      });
    }
  };

  const sortedEvents = useMemo(() => {
    return [...allEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allEvents]);
  
  if (isAuthLoading) {
     return <Box sx={{display: 'flex', justifyContent: 'center', my: 4}}><CircularProgress /></Box>
  }

  return (
    <Box sx={{py: 4}}>
      <Container maxWidth="xl">
        <Typography variant="h4" component="h1" gutterBottom>
          {t('studentSchedule.myScheduleTitle')}
        </Typography>

        <Paper sx={{p: 2, borderRadius: 2}}>
          {isLoadingSchedule ? (
              <Skeleton variant="rectangular" height={500} />
          ) : (
            <ScheduleCalendar 
              events={sortedEvents} 
              onSelectEvent={setSelectedEvent} 
            />
          )}
        </Paper>
        
        {/* РЕНДЕРИМ УЛУЧШЕННЫЙ СПИСОК УРОКОВ */}
        <LessonsList
          schedule={sortedEvents}
          isLoading={isLoadingSchedule}
          onEventSelect={setSelectedEvent}
        />

      </Container>
      
      <HomeworkDialog
        event={selectedEvent} 
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)} 
        onSendHomework={handleSendHomework}
      />
    </Box>
  );
};

export default StudentSchedulePage;