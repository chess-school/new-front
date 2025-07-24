// import { useState, useEffect, useMemo, useCallback } from 'react';
// import { notification } from 'antd';
// import { TFunction } from 'i18next';
// import { ScheduleEvent } from '@/types/SheduleEvent';
// import { getScheduleByStudent } from '@/api/schedule';
// import { sendHomework } from '@/api/homework';
// import { createNotification as apiCreateNotification } from '@/api/notifications';
// import { useAuthUser } from '@/hooks/useStudent'; // Наш новый хук

// export const useStudentSchedule = (t: TFunction) => {
//   const { studentId } = useAuthUser();
//   const [allEvents, setAllEvents] = useState<ScheduleEvent[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [statusFilters, setStatusFilters] = useState<string[]>([]);
  
//   // Загрузка данных
//   useEffect(() => {
//     if (!studentId) {
//       setLoading(false);
//       notification.error({
//           message: t('errors.userNotFound'),
//           description: undefined
//       });
//       return;
//     }
    
//     const fetchSchedule = async () => {
//       setLoading(true);
//       try {
//         const scheduleData = await getScheduleByStudent(studentId);
//         setAllEvents(scheduleData);
//       } catch (error) {
//         console.error('Ошибка при загрузке расписания:', error);
//         notification.error({
//             message: t('errors.fetchSchedule'),
//             description: undefined
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSchedule();
//   }, [studentId, t]);

//   // Фильтрация событий
//   const filteredEvents = useMemo(() => {
//     let events = [...allEvents];
//     if (statusFilters.length > 0) {
//       events = events.filter(event => statusFilters.includes(event.status));
//     }
//     return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
//   }, [allEvents, statusFilters]);

//   // Отправка ДЗ
//   const submitHomework = useCallback(async (event: ScheduleEvent, homeworkText: string, screenshot: File | null) => {
//     if (!studentId) return;

//     try {
//       await sendHomework({
//         studentId,
//         scheduleId: event._id,
//         homeworkText: homeworkText.trim() ? homeworkText : undefined,
//         screenshot: screenshot || undefined,
//       });

//       // Отправка уведомления тренеру
//       if (event.coach) {
//         await apiCreateNotification({
//             recipient: event.coach,
//             type: 'homework_submission',
//             content: `Ученик отправил домашнее задание по теме: "${event.title}"`,
//             metadata: { scheduleId: event._id },
//         });
//       }
      
//       notification.success({
//           message: t('studentSchedule.homeworkSentSuccess'),
//           description: undefined
//       });
      
//       // Оптимистичное обновление UI
//       setAllEvents(prevEvents => 
//         prevEvents.map(e => 
//           e._id === event._id ? { ...e, status: 'pending' } : e
//         )
//       );
//     } catch (error) {
//       console.error('Ошибка при отправке ДЗ:', error);
//       notification.error({
//           message: t('errors.sendHomework'),
//           description: undefined
//       });
//       throw error; // Пробрасываем ошибку, чтобы компонент мог обработать состояние isSubmitting
//     }
//   }, [studentId, t]);

//   return {
//     loading,
//     allEvents,
//     filteredEvents,
//     statusFilters,
//     setStatusFilters,
//     submitHomework,
//   };
// };