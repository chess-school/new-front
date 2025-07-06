import axiosInstance from '@/api';

export const getAvatarUrl = (userId: string): string => {
  const baseURL = axiosInstance.defaults.baseURL;
  
  if (!baseURL) {
    return '/default-avatar.png'; 
  }
  
  return `${baseURL}/auth/avatar/${userId}`;
};