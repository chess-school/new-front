import axiosInstance from '@/api';
import type {
  CourseSummary, CourseDetail, CreateCoursePayload, UpdateCoursePayload, CourseStatus,
} from '@/types/Course';

/** Курсы текущего тренера (включая черновики), изоляция по активному клубу. */
export const getMyCourses = async (): Promise<CourseSummary[]> => {
  const res = await axiosInstance.get('/coaches/me/courses');
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
