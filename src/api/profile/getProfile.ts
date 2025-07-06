import axiosInstance from '@/api';
import { User } from '@/types/User';

export const getProfile = async (): Promise<User> => {
  const response = await axiosInstance.get('/auth/profile');
  return response.data;
};

interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  avatar?: File;
}

export const updateProfile = async (data: UpdateProfilePayload): Promise<User> => {
  const formData = new FormData();

  (Object.keys(data) as Array<keyof UpdateProfilePayload>).forEach(key => {
    const value = data[key];
    if (value) {
      formData.append(key, value);
    }
  });

  const response = await axiosInstance.put('/auth/profile', formData);
  return response.data;
};


export const getPlayerStats = async (userId: string): Promise<any> => { 
  const response = await axiosInstance.get(`/player/${userId}`);
  return response.data;
};

export const getAvatarUrl = (userId: string): string => {
  const baseURL = axiosInstance.defaults.baseURL;
  
  if (!baseURL) {
    return '/default-avatar.png'; 
  }
  
  return `${baseURL}/auth/avatar/${userId}`;
};