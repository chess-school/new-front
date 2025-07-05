import axiosInstance from '@/api';
import { Student } from '@/types/Student'; 

export const getStudentDetails = async (coachEmail: string, studentId: string): Promise<Student | null> => {
  try {
    const response = await axiosInstance.get('/trainer/student', {
      params: { coachEmail, studentId },
    });
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении данных ученика с ID ${studentId}:`, error);
    return null; 
  }
};
