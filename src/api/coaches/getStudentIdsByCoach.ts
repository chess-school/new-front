import axiosInstance from '@/api';


export const getStudentIdsByCoach = async (coachEmail: string): Promise<string[]> => {
  const response = await axiosInstance.get('/trainer/students', {
    params: { coachEmail }, 
  });
  return response.data;
};