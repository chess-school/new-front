import axiosInstance from '@/api';

// Занятия в расписании API v2 (/api/v2/schedule). Индивидуальное занятие привязано к студенту
// через context { type: 'individual', refId: <_id пользователя> }.

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed';
export const LESSON_STATUSES: LessonStatus[] = ['scheduled', 'completed', 'cancelled', 'missed'];

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  date: string;
  durationMinutes?: number;
  link?: string;
  status: LessonStatus;
  context: { type: 'individual' | 'group' | 'course_wide'; refId: string };
}

export interface LessonPayload {
  title: string;
  description?: string;
  date: string;
  durationMinutes?: number;
  link?: string;
}

/** Всё «моё» расписание: тренер получает все свои занятия */
export const getMyLessons = async (): Promise<Lesson[]> => {
  const response = await axiosInstance.get('/schedule');
  return response.data.data;
};

export const createIndividualLesson = async (studentId: string, payload: LessonPayload): Promise<Lesson> => {
  const response = await axiosInstance.post('/schedule', { ...payload, eventType: 'individual', contextId: studentId });
  return response.data;
};

/** Сколько адресатов уведомлено о занятии (почта + колокольчик); бэкенд возвращает в поле notified */
export interface NotifyResult { total: number; failed: number }

export interface CreateLessonInput extends LessonPayload {
  /** 'group' → contextId = id группы; 'individual' → contextId = _id пользователя-студента */
  eventType: 'individual' | 'group';
  contextId: string;
  /** Уведомить адресатов (почта от лица тренера + уведомление на сайте). По умолчанию true на бэке */
  notify?: boolean;
  /** Общее сообщение тренера в письме/уведомлении (для всех адресатов) */
  message?: string;
  /** Личное сообщение по каждому адресату: { [userId]: текст } — приоритетнее общего в приписке */
  personalMessages?: Record<string, string>;
}

/** Создать занятие (групповое или индивидуальное) с опциональным оповещением адресатов */
export const createLesson = async (input: CreateLessonInput): Promise<Lesson & { notified?: NotifyResult | null }> => {
  const response = await axiosInstance.post('/schedule', input);
  return response.data;
};

export const updateLesson = async (lessonId: string, payload: Partial<LessonPayload> & { status?: LessonStatus }): Promise<Lesson> => {
  const response = await axiosInstance.put(`/schedule/${lessonId}`, payload);
  return response.data;
};

export const deleteLesson = async (lessonId: string): Promise<void> => {
  await axiosInstance.delete(`/schedule/${lessonId}`);
};
