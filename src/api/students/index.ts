import axiosInstance from '@/api';
import { EnrollmentUpdate, EnrollPayload, Student, StudentsPage, StudentsQuery } from '@/types/Student';

// ---------- Студенты (/api/v2/students) ----------

/** Свои студенты (COACH) или все (ADMIN) — одним запросом, с записями на курсы */
export const getStudents = async (params: StudentsQuery): Promise<StudentsPage> => {
  const response = await axiosInstance.get('/students', { params });
  return response.data;
};

/** Записать зарегистрированного пользователя на курс; возвращает карточку студента */
export const enrollStudent = async (payload: EnrollPayload): Promise<Student> => {
  const response = await axiosInstance.post('/students', payload);
  return response.data.data;
};

export const updateEnrollment = async (studentUuid: string, enrollmentId: string, payload: EnrollmentUpdate) => {
  const response = await axiosInstance.patch(`/students/${studentUuid}/enrollments/${enrollmentId}`, payload);
  return response.data.data;
};

export const deleteEnrollment = async (studentUuid: string, enrollmentId: string): Promise<void> => {
  await axiosInstance.delete(`/students/${studentUuid}/enrollments/${enrollmentId}`);
};

// ---------- Справочники тренера для форм ----------

export interface CoachCourse { _id: string; title: string; status: string }
export interface CoachGroup { _id: string; name: string; status: 'active' | 'archived' }

export const getMyCourses = async (): Promise<CoachCourse[]> => {
  const response = await axiosInstance.get('/coaches/me/courses');
  return response.data.data;
};

/** Каталог опубликованных курсов — для администратора без профиля тренера */
export const getCatalogCourses = async (): Promise<CoachCourse[]> => {
  const response = await axiosInstance.get('/courses', { params: { limit: 100 } });
  return response.data.data;
};

export const getMyGroups = async (): Promise<CoachGroup[]> => {
  const response = await axiosInstance.get('/coaches/me/groups');
  return response.data.data;
};
