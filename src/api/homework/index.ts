import axiosInstance from '@/api';
import { Assignment, MyAssignment, PuzzleAssignmentInput, Submission, SubmissionForReview, SubmissionStatus } from '@/types/Homework';

// ---------- Студент ----------

/** ДЗ, адресованные мне (лично, моей группе, моему курсу), с моей сдачей */
export const getMyAssignments = async (): Promise<MyAssignment[]> => {
  const response = await axiosInstance.get('/assignments/my');
  return response.data.data;
};

/** Сдать или пересдать ДЗ: текст и/или скриншот (изображение до 5 МБ) */
export const submitAssignment = async (assignmentId: string, contentText: string, file: File | null): Promise<Submission> => {
  const formData = new FormData();
  formData.append('contentText', contentText);
  if (file) formData.append('file', file);
  const response = await axiosInstance.put(`/assignments/${assignmentId}/submission`, formData);
  return response.data.data;
};

// ---------- Тренер ----------

/** ДЗ, заданное к занятию (или null) */
export const getLessonAssignment = async (scheduleId: string): Promise<Assignment | null> => {
  const response = await axiosInstance.get('/assignments', { params: { scheduleId } });
  return response.data.data[0] ?? null;
};

export const createAssignment = async (payload: { scheduleId: string; description: string; title?: string; dueDate?: string }): Promise<Assignment> => {
  const response = await axiosInstance.post('/assignments', payload);
  return response.data.data;
};

/** Задать ДЗ «решать задачи из задачника» (не привязано к занятию) */
export const createPuzzleAssignment = async (payload: PuzzleAssignmentInput): Promise<Assignment> => {
  const response = await axiosInstance.post('/assignments/puzzles', payload);
  return response.data.data;
};

export const updateAssignment = async (assignmentId: string, payload: { description?: string; title?: string; dueDate?: string | null }): Promise<Assignment> => {
  const response = await axiosInstance.patch(`/assignments/${assignmentId}`, payload);
  return response.data.data;
};

export const deleteAssignment = async (assignmentId: string): Promise<void> => {
  await axiosInstance.delete(`/assignments/${assignmentId}`);
};

export const getSubmissionsForReview = async (status: SubmissionStatus = 'submitted'): Promise<SubmissionForReview[]> => {
  const response = await axiosInstance.get('/submissions/review', { params: { status } });
  return response.data.data;
};

export const reviewSubmission = async (submissionId: string, status: 'approved' | 'needs_revision', comment: string): Promise<Submission> => {
  const response = await axiosInstance.patch(`/submissions/${submissionId}/review`, { status, comment });
  return response.data.data;
};

// ---------- Оба ----------

/** Скриншот сдачи (видят студент-автор, автор ДЗ и админ) */
export const getSubmissionAttachment = async (submissionId: string): Promise<Blob> => {
  const response = await axiosInstance.get(`/submissions/${submissionId}/attachment`, { responseType: 'blob' });
  return response.data;
};
