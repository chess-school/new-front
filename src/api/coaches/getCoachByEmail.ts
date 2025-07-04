import axiosInstance from '@/api'; 

export const getCoachesByEmail = async (emails: string[]) => {
    const response = await axiosInstance.post('/auth/coaches-by-email', { emails });
    return response.data;
  };