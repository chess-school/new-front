import axiosInstance from '@/api';

export const getPlayerStats = async (userId: string): Promise<unknown> => { 
  const response = await axiosInstance.get(`/player/${userId}`);
  return response.data;
};
