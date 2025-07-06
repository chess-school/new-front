import axiosInstance from '@/api';
import { User } from '@/types/User';

export const getProfile = async (): Promise<User> => {
  const response = await axiosInstance.get('/auth/profile');
  return response.data;
};
