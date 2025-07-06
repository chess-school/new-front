import axiosInstance from '@/api';
import { Student } from '@/types/Student'; 

export const getStudentDetails = async (coachEmail: string, studentId: string): Promise<Student | null> => {
    const response = await axiosInstance.get('/trainer/student', {
      params: { coachEmail, studentId },
    });
    return response.data;
};
