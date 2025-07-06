import axiosInstance from '@/api';

export const markAsRead = async (notificationId: string) => {
  const response = await axiosInstance.patch('/notifications', {}, {
    params: {
      notification_id: notificationId
    }
  });
  return response.data;
};