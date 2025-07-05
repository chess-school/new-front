import axiosInstance from '@/api';

export const removeStudentFromCoach = async (coachEmail: string, studentId: string): Promise<void> => {
  await axiosInstance.delete('/trainer/remove-student', {
    params: { coachEmail, studentId },
  });
};