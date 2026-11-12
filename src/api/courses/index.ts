import axiosInstance from '@/api';
import type {
  CourseSummary, CourseDetail, CreateCoursePayload, UpdateCoursePayload, CourseStatus,
} from '@/types/Course';

/** Курсы текущего тренера (включая черновики), изоляция по активному клубу. */
export const getMyCourses = async (): Promise<CourseSummary[]> => {
  const res = await axiosInstance.get('/coaches/me/courses');
  return res.data.data;
};

/** Курсы, на которые зачислен текущий ученик (раздел «My courses»). */
export const getEnrolledCourses = async (): Promise<CourseSummary[]> => {
  const res = await axiosInstance.get('/courses/enrolled');
  return res.data.data;
};

/** Один курс с нормализованным контентом (modules = {version,chapters[blocks]}). */
export const getCourse = async (courseId: string): Promise<CourseDetail> => {
  const res = await axiosInstance.get(`/courses/${courseId}`);
  return res.data;
};

export const createCourse = async (payload: CreateCoursePayload): Promise<CourseDetail> => {
  const res = await axiosInstance.post('/courses', payload);
  return res.data;
};

export const updateCourse = async (
  courseId: string,
  payload: UpdateCoursePayload,
): Promise<CourseDetail> => {
  const res = await axiosInstance.put(`/courses/${courseId}`, payload);
  return res.data;
};

export const setCourseStatus = async (courseId: string, status: CourseStatus): Promise<void> => {
  await axiosInstance.patch(`/courses/${courseId}/status`, { status });
};

// --- Прогресс по курсу (Фаза A5) ---

/** Свой прогресс: id пройденных блоков. */
export const getMyCourseProgress = async (courseId: string): Promise<string[]> => {
  const res = await axiosInstance.get(`/courses/${courseId}/progress`, { silent: true });
  return res.data?.data?.completed ?? [];
};

/** Отметить блок пройденным (идемпотентно). Тихо — фоновая отметка не должна шуметь тостами. */
export const markCourseBlockComplete = async (
  courseId: string, blockId: string, chapterId?: string,
): Promise<void> => {
  await axiosInstance.post(`/courses/${courseId}/progress`, { blockId, chapterId }, { silent: true });
};

export interface CourseProgressStudent {
  studentId: string;
  uuid?: string;
  name: string;
  avatarUrl?: string;
  completed: number;
  total: number;
  percent: number;
  lastAt: string | null;
}
export interface CourseProgressSummary {
  total: number;
  students: CourseProgressStudent[];
}

/** Сводка по ученикам (COACH/ADMIN). */
export const getCourseProgressSummary = async (courseId: string): Promise<CourseProgressSummary> => {
  const res = await axiosInstance.get(`/courses/${courseId}/progress/summary`);
  return res.data.data;
};
