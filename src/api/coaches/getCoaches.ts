import axiosInstance from '@/api'; 

export const getCoaches = async () => {
  const response = await axiosInstance.get('/coaches');
  return response.data;
};