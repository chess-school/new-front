import axiosInstance from '@/api'; 

export const getNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return response.data;
};
