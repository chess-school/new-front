import axiosInstance from '@/api';
import { User } from '@/types/User'; 

export const getMyProfile = async (): Promise<User> => {
  const response = await axiosInstance.get('/users/me');
  return response.data;
};