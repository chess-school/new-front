import { AxiosProgressEvent } from 'axios';
import axiosInstance from '@/api';
import {
  CourseSyncResult,
  DigitizeTask,
  DigitizeTaskCreated,
  ExerciseUpdate,
  Exercise,
  PuzzleBook,
  PuzzleBookStatus,
  PuzzleBookSummary,
} from '@/types/PuzzleBook';

// ---------- Оцифровка (прокси бэкенда -> chess_pdf_digitizer) ----------

/** formData: file (PDF), pages_range ("39-105"), solutions_pages? ("548-814"), max_per_file? */
export const startDigitize = async (
  formData: FormData,
  onUploadProgress?: (percent: number) => void,
): Promise<DigitizeTaskCreated> => {
  const response = await axiosInstance.post('/digitizer/digitize', formData, {
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (onUploadProgress && event.total) {
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return response.data;
};

export const getDigitizeTask = async (id: string): Promise<DigitizeTask> => {
  const response = await axiosInstance.get(`/digitizer/tasks/${encodeURIComponent(id)}`);
  return response.data;
};

/**
 * Создаёт задачник из готовых глав задачи или добавляет в уже созданный новые главы.
 * Можно вызывать, пока книга ещё обрабатывается.
 */
export const convertTaskToCourse = async (
  taskId: string,
  courseTitle: string,
): Promise<CourseSyncResult> => {
  const response = await axiosInstance.post(`/digitizer/tasks/${encodeURIComponent(taskId)}/course`, {
    title: courseTitle,
  });
  return response.data.data;
};

// ---------- Задачники ----------

export const getPuzzleBooks = async (): Promise<PuzzleBookSummary[]> => {
  const response = await axiosInstance.get('/puzzle-books');
  return response.data.data;
};

export const getPuzzleBook = async (bookId: string): Promise<PuzzleBook> => {
  const response = await axiosInstance.get(`/puzzle-books/${bookId}`);
  return response.data.data;
};

export const updatePuzzleBook = async (
  bookId: string,
  payload: Partial<{ title: string; description: string; status: PuzzleBookStatus }>,
): Promise<Pick<PuzzleBook, '_id' | 'title' | 'description' | 'status'>> => {
  const response = await axiosInstance.patch(`/puzzle-books/${bookId}`, payload);
  return response.data.data;
};

export const updateExercise = async (
  bookId: string,
  exerciseId: string,
  payload: ExerciseUpdate,
): Promise<Exercise> => {
  const response = await axiosInstance.put(`/puzzle-books/${bookId}/exercises/${exerciseId}`, payload);
  return response.data.data;
};
