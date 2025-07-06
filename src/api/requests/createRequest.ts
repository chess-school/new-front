import axiosInstance from '@/api'; 

export const createRequest = async (coachId: string, experience: string, goals: string) => {
  const response = await axiosInstance.post(
      '/trainer/request', 
      {
        coachId,
        experience,
        goals,
      }
    );
    return response.data;
};